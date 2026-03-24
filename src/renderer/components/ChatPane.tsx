import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '../store/appStore'
import { useClaude } from '../hooks/useClaude'
import AttachedFiles from './AttachedFiles'

function MessageBubble({ role, content }: { role: string; content: string }) {
  return (
    <div className={`message-bubble ${role}`}>
      <div className="message-avatar">
        {role === 'user' ? '👤' : '⚖️'}
      </div>
      <div className="message-body">
        <div className="message-role">{role === 'user' ? 'You' : 'Legal AI'}</div>
        <div className="message-content">
          {content.split('\n').map((line, i) => (
            <span key={i}>
              {line}
              {i < content.split('\n').length - 1 && <br />}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function StreamingBubble({ text }: { text: string }) {
  return (
    <div className="message-bubble assistant streaming">
      <div className="message-avatar">⚖️</div>
      <div className="message-body">
        <div className="message-role">Legal AI</div>
        <div className="message-content">
          {text || <span className="typing-indicator"><span /><span /><span /></span>}
        </div>
      </div>
    </div>
  )
}

export default function ChatPane() {
  const { messages, isRunning, streamingText, mode } = useAppStore()
  const { send, cancel } = useClaude()
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  // Listen for quick prompts from TopBar
  useEffect(() => {
    const handler = (e: Event) => {
      const prompt = (e as CustomEvent).detail as string
      setInput(prompt)
      textareaRef.current?.focus()
    }
    window.addEventListener('quick-prompt', handler)
    return () => window.removeEventListener('quick-prompt', handler)
  }, [])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || isRunning) return
    setInput('')
    await send(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="chat-pane">
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty">
            <div className="empty-icon">⚖️</div>
            <h2>Legal AI Assistant</h2>
            <p>
              {mode === 'chat'
                ? 'Attach documents from the sidebar, then ask questions about them. Use quick prompts above for common tasks.'
                : 'Agent mode active — Claude can read, analyze, and write files autonomously. Tell it what to do.'}
            </p>
            <div className="empty-examples">
              <p className="examples-label">Try asking:</p>
              <button onClick={() => setInput('What are the key provisions of the attached trust document?')}>
                "What are the key provisions of the attached trust?"
              </button>
              <button onClick={() => setInput('Analyze this will for any execution defects or missing provisions.')}>
                "Analyze this will for execution defects"
              </button>
              <button onClick={() => setInput('Does this client qualify for Florida ICP Medicaid based on the intake form?')}>
                "Does this client qualify for FL ICP Medicaid?"
              </button>
            </div>
          </div>
        )}

        {messages.map(msg => (
          <MessageBubble key={msg.id} role={msg.role} content={msg.content} />
        ))}

        {isRunning && (
          <StreamingBubble text={streamingText} />
        )}

        <div ref={bottomRef} />
      </div>

      <div className="chat-input-area">
        <AttachedFiles compact />

        <div className="chat-input-row">
          <div className="input-wrapper">
            <textarea
              ref={textareaRef}
              className="chat-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                mode === 'agent'
                  ? 'Tell the agent what to do... (e.g. "Read all PDFs in my downloads and summarize each one")'
                  : 'Ask about attached documents, draft requests, or legal questions...'
              }
              rows={3}
              disabled={isRunning}
            />
            <div className="input-hint">Shift+Enter for new line · Enter to send</div>
          </div>

          <div className="input-actions">
            {isRunning ? (
              <button className="cancel-btn" onClick={cancel} title="Stop generation">
                ⏹ Stop
              </button>
            ) : (
              <button
                className="send-btn"
                onClick={handleSend}
                disabled={!input.trim()}
              >
                Send ↵
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
