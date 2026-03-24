import Anthropic from '@anthropic-ai/sdk'
import { executeFileTool } from '../tools/file-tools'
import { executeDocTool } from '../tools/doc-tools'

export type AgentMode = 'chat' | 'agent'

export interface ToolCallEvent {
  id: string
  name: string
  input: Record<string, unknown>
  result?: string
  status: 'running' | 'done' | 'error'
}

export interface AgentCallbacks {
  onText: (text: string, done: boolean) => void
  onToolCall: (event: ToolCallEvent) => void
  onError: (error: string) => void
}

// ─── Legal-focused system prompts ─────────────────────────────────────────────

const CHAT_SYSTEM = `You are a highly skilled AI legal assistant specializing in:
- Estate planning (wills, revocable living trusts, powers of attorney, health care directives)
- Elder law and Medicaid planning (Florida ICP, Pennsylvania MA-LTC)
- Asset protection strategies
- Document analysis and drafting

You are assisting Carl B. Zacharia, Esq., a licensed Pennsylvania (1993) and Florida (1994) attorney 
at Zacharia Frey PLLC, Bonita Springs, FL.

IMPORTANT RULES:
- Never invent case law, statutes, or regulations. If uncertain, say so explicitly.
- Florida deeds require two witnesses with printed names AND addresses, plus notary acknowledgment.
- Distinguish clearly between PA and FL law when jurisdiction matters.
- When drafting documents, flag all items requiring attorney review with [REVIEW REQUIRED].
- For Medicaid questions, apply current Florida ICP and PA MA-LTC rules precisely.`

const AGENT_SYSTEM = `${CHAT_SYSTEM}

You also have access to the local filesystem and document tools. Use them proactively to:
- Read uploaded client documents before analyzing
- Extract text from PDFs and Word files
- Write completed draft documents to disk
- Search for relevant files in specified directories

Always confirm the file path before writing. Summarize what you read before analyzing.`

// ─── Tool definitions exposed to Claude ───────────────────────────────────────

const TOOLS: Anthropic.Tool[] = [
  {
    name: 'read_file',
    description: 'Read the raw text contents of any file (txt, md, json, etc.)',
    input_schema: {
      type: 'object' as const,
      properties: {
        path: { type: 'string', description: 'Absolute file path to read' }
      },
      required: ['path']
    }
  },
  {
    name: 'extract_pdf',
    description: 'Extract text content from a PDF file for analysis',
    input_schema: {
      type: 'object' as const,
      properties: {
        path: { type: 'string', description: 'Absolute path to the PDF file' }
      },
      required: ['path']
    }
  },
  {
    name: 'extract_docx',
    description: 'Extract text content from a Word (.docx) file for analysis',
    input_schema: {
      type: 'object' as const,
      properties: {
        path: { type: 'string', description: 'Absolute path to the .docx file' }
      },
      required: ['path']
    }
  },
  {
    name: 'write_file',
    description: 'Write text content to a file on disk (creates directories if needed)',
    input_schema: {
      type: 'object' as const,
      properties: {
        path: { type: 'string', description: 'Absolute path where file should be written' },
        content: { type: 'string', description: 'Text content to write' }
      },
      required: ['path', 'content']
    }
  },
  {
    name: 'list_directory',
    description: 'List all files and subfolders in a directory',
    input_schema: {
      type: 'object' as const,
      properties: {
        path: { type: 'string', description: 'Absolute path to the directory' }
      },
      required: ['path']
    }
  },
  {
    name: 'search_files',
    description: 'Search for files by name pattern within a directory',
    input_schema: {
      type: 'object' as const,
      properties: {
        directory: { type: 'string', description: 'Root directory to search in' },
        pattern: { type: 'string', description: 'Glob pattern, e.g. "*.pdf" or "**/*trust*"' }
      },
      required: ['directory', 'pattern']
    }
  },
  {
    name: 'open_file',
    description: 'Open a file with the system default application (Word, Preview, etc.)',
    input_schema: {
      type: 'object' as const,
      properties: {
        path: { type: 'string', description: 'Absolute path to the file to open' }
      },
      required: ['path']
    }
  }
]

// ─── Tool dispatcher ───────────────────────────────────────────────────────────

async function executeTool(name: string, input: Record<string, unknown>): Promise<string> {
  const docTools = ['extract_pdf', 'extract_docx']
  if (docTools.includes(name)) {
    return executeDocTool(name, input)
  }
  return executeFileTool(name, input)
}

// ─── Main agentic loop ─────────────────────────────────────────────────────────

export async function runClaudeAgent(
  messages: Anthropic.MessageParam[],
  mode: AgentMode,
  apiKey: string,
  callbacks: AgentCallbacks,
  signal?: AbortSignal,
  systemOverride?: string
): Promise<void> {
  const client = new Anthropic({ apiKey })
  const system = systemOverride ?? (mode === 'agent' ? AGENT_SYSTEM : CHAT_SYSTEM)
  const tools = mode === 'agent' ? TOOLS : []

  let history = [...messages]
  let iterations = 0
  const MAX_ITERATIONS = 20 // safety limit

  while (iterations < MAX_ITERATIONS) {
    if (signal?.aborted) {
      callbacks.onError('Cancelled by user')
      return
    }

    iterations++

    // Use streaming for chat mode, regular for agent (cleaner tool handling)
    if (mode === 'chat') {
      const stream = await client.messages.stream({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system,
        messages: history
      })

      let fullText = ''
      for await (const chunk of stream) {
        if (signal?.aborted) break
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          fullText += chunk.delta.text
          callbacks.onText(chunk.delta.text, false)
        }
      }
      callbacks.onText('', true) // signal done
      return

    } else {
      // Agent mode — non-streaming for reliable tool_use parsing
      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8096,
        system,
        tools: tools as Anthropic.Tool[],
        messages: history
      })

      // Emit any text blocks
      for (const block of response.content) {
        if (block.type === 'text' && block.text) {
          callbacks.onText(block.text, false)
        }
      }

      // If done, exit
      if (response.stop_reason === 'end_turn') {
        callbacks.onText('', true)
        return
      }

      // Handle tool calls
      if (response.stop_reason === 'tool_use') {
        const toolResults: Anthropic.ToolResultBlockParam[] = []

        for (const block of response.content) {
          if (block.type !== 'tool_use') continue

          const event: ToolCallEvent = {
            id: block.id,
            name: block.name,
            input: block.input as Record<string, unknown>,
            status: 'running'
          }
          callbacks.onToolCall(event)

          let result: string
          try {
            result = await executeTool(block.name, block.input as Record<string, unknown>)
            callbacks.onToolCall({ ...event, result, status: 'done' })
          } catch (err) {
            result = `Error: ${err instanceof Error ? err.message : String(err)}`
            callbacks.onToolCall({ ...event, result, status: 'error' })
          }

          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: result
          })
        }

        // Add to history and loop
        history.push({ role: 'assistant', content: response.content })
        history.push({ role: 'user', content: toolResults })
      } else {
        // Unexpected stop reason
        callbacks.onText('', true)
        return
      }
    }
  }

  callbacks.onError('Agent reached maximum iteration limit (20). Please refine your request.')
}
