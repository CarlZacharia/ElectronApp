import { useAppStore } from '../store/appStore'

const TOOL_ICONS: Record<string, string> = {
  read_file: '📖',
  write_file: '💾',
  extract_pdf: '📄',
  extract_docx: '📝',
  list_directory: '📁',
  search_files: '🔍',
  open_file: '🖥️'
}

function ToolCallCard({ tc }: { tc: ReturnType<typeof useAppStore.getState>['toolCalls'][0] }) {
  const statusIcon = tc.status === 'running' ? '⏳' : tc.status === 'done' ? '✅' : '❌'
  const icon = TOOL_ICONS[tc.name] ?? '🔧'

  return (
    <div className={`tool-card ${tc.status}`}>
      <div className="tool-card-header">
        <span className="tool-icon">{icon}</span>
        <span className="tool-name">{tc.name.replace(/_/g, ' ')}</span>
        <span className="tool-status">{statusIcon}</span>
      </div>

      <div className="tool-input">
        {Object.entries(tc.input).map(([k, v]) => (
          <div key={k} className="tool-input-row">
            <span className="tool-key">{k}:</span>
            <span className="tool-val" title={String(v)}>
              {String(v).length > 60 ? String(v).slice(0, 57) + '...' : String(v)}
            </span>
          </div>
        ))}
      </div>

      {tc.result && tc.status !== 'running' && (
        <div className={`tool-result ${tc.status}`}>
          <span className="tool-result-text">
            {tc.result.length > 120 ? tc.result.slice(0, 117) + '...' : tc.result}
          </span>
        </div>
      )}

      <div className="tool-time">
        {tc.timestamp.toLocaleTimeString()}
      </div>
    </div>
  )
}

export default function ToolLog() {
  const { toolCalls, mode } = useAppStore()

  if (mode !== 'agent') return null

  return (
    <aside className="tool-log">
      <div className="tool-log-header">
        <span>🤖 Agent Activity</span>
        <span className="tool-count">{toolCalls.length} calls</span>
      </div>
      <div className="tool-log-body">
        {toolCalls.length === 0 ? (
          <div className="tool-log-empty">
            <p>Tool calls will appear here when the agent is working.</p>
          </div>
        ) : (
          [...toolCalls].reverse().map(tc => (
            <ToolCallCard key={tc.id} tc={tc} />
          ))
        )}
      </div>
    </aside>
  )
}
