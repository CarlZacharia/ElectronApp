import { useAppStore } from '../store/appStore'

const EXT_ICONS: Record<string, string> = {
  pdf: '📄',
  docx: '📝',
  doc: '📝',
  txt: '📃',
  md: '📃',
  json: '⚙️'
}

export default function AttachedFiles({ compact = false }: { compact?: boolean }) {
  const { attachedFiles, removeFile } = useAppStore()

  if (attachedFiles.length === 0) {
    if (compact) return null
    return (
      <div className="attached-empty">
        No documents attached. Click "Attach Document" to add files.
      </div>
    )
  }

  return (
    <div className={`attached-files ${compact ? 'compact' : ''}`}>
      {attachedFiles.map(f => (
        <div key={f.path} className="attached-file" title={f.path}>
          <span className="file-icon">{EXT_ICONS[f.ext] ?? '📎'}</span>
          <span className="file-name">{f.name}</span>
          {f.extractedText && (
            <span className="file-extracted" title="Text extracted — ready for analysis">✓</span>
          )}
          <button
            className="file-remove"
            onClick={() => removeFile(f.path)}
            title="Remove"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
