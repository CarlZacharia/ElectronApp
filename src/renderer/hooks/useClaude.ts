import { useEffect, useCallback, useRef } from 'react'
import { useAppStore } from '../store/appStore'

declare global {
  interface Window {
    api: {
      claude: {
        run: (messages: unknown[], mode: string, sessionId: string) => Promise<unknown>
        cancel: () => Promise<unknown>
        onText: (cb: (data: { text: string; done: boolean; sessionId: string }) => void) => () => void
        onToolCall: (cb: (data: unknown) => void) => () => void
        onError: (cb: (data: { error: string; sessionId: string }) => void) => () => void
      }
      file: {
        read: (path: string) => Promise<string>
        write: (path: string, content: string) => Promise<string>
        list: (path: string) => Promise<string>
        open: (path: string) => Promise<void>
        stat: (path: string) => Promise<{ size: number; modified: string; isDirectory: boolean } | null>
      }
      doc: {
        extractPdf: (path: string) => Promise<string>
        extractDocx: (path: string) => Promise<string>
      }
      dialog: {
        openFile: (opts?: { filters?: { name: string; extensions: string[] }[]; multiple?: boolean }) => Promise<string | string[] | null>
        openFolder: () => Promise<string | null>
        saveFile: (opts?: { defaultName?: string }) => Promise<string | null>
      }
      settings: {
        get: () => Promise<Record<string, unknown>>
        set: (updates: Record<string, unknown>) => Promise<void>
        getApiKeySet: () => Promise<{ isSet: boolean }>
      }
    }
  }
}

export function useClaude() {
  const {
    messages,
    mode,
    attachedFiles,
    addMessage,
    appendStreamText,
    finalizeStream,
    addToolCall,
    updateToolCall,
    setRunning,
    streamingText
  } = useAppStore()

  const cleanupRef = useRef<(() => void)[]>([])

  // Register IPC listeners on mount
  useEffect(() => {
    const removeText = window.api.claude.onText(({ text, done, sessionId }) => {
      const { currentSessionId } = useAppStore.getState()
      if (sessionId !== currentSessionId) return

      if (done) {
        finalizeStream()
      } else {
        appendStreamText(text)
      }
    })

    const removeToolCall = window.api.claude.onToolCall((data: unknown) => {
      const tc = data as { id: string; name: string; input: Record<string, unknown>; result?: string; status: 'running' | 'done' | 'error' }
      const { toolCalls } = useAppStore.getState()
      const existing = toolCalls.find(t => t.id === tc.id)
      if (existing) {
        updateToolCall(tc.id, { result: tc.result, status: tc.status })
      } else {
        addToolCall({ id: tc.id, name: tc.name, input: tc.input, status: tc.status })
      }
    })

    const removeError = window.api.claude.onError(({ error }) => {
      addMessage({ role: 'assistant', content: `⚠️ Error: ${error}` })
      useAppStore.getState().setRunning(false)
    })

    cleanupRef.current = [removeText, removeToolCall, removeError]
    return () => cleanupRef.current.forEach(fn => fn())
  }, [])

  const send = useCallback(async (userText: string) => {
    const sessionId = `session-${Date.now()}`

    // Add user message to store
    addMessage({ role: 'user', content: userText })
    setRunning(true, sessionId)

    // Build message history for API
    const history = useAppStore.getState().messages.map(m => ({
      role: m.role,
      content: m.content
    }))

    // If files are attached in chat mode, prepend their context
    const finalMessages = [...history]

    // Attach file context if any files are loaded
    if (attachedFiles.length > 0 && mode === 'chat') {
      const fileContext = attachedFiles
        .filter(f => f.extractedText)
        .map(f => `[Attached: ${f.name}]\n${f.extractedText}`)
        .join('\n\n---\n\n')

      if (fileContext) {
        finalMessages.unshift({
          role: 'user',
          content: `The following documents have been provided for context:\n\n${fileContext}`
        })
        finalMessages.splice(1, 0, {
          role: 'assistant',
          content: 'I have received and reviewed the attached documents. I will use them to inform my responses.'
        })
      }
    }

    await window.api.claude.run(finalMessages, mode, sessionId)
  }, [messages, mode, attachedFiles, addMessage, setRunning])

  const cancel = useCallback(async () => {
    await window.api.claude.cancel()
    useAppStore.getState().setRunning(false)
  }, [])

  return { send, cancel, streamingText }
}
