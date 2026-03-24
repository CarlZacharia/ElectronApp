import { useState, useEffect } from 'react'

interface Props {
  onClose: () => void
}

export default function SettingsModal({ onClose }: Props) {
  const [apiKey, setApiKey] = useState('')
  const [workDir, setWorkDir] = useState('')
  const [defaultMode, setDefaultMode] = useState<'chat' | 'agent'>('chat')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    window.api.settings.get().then((s) => {
      const settings = s as { defaultWorkDir?: string; defaultMode?: 'chat' | 'agent' }
      setWorkDir(settings.defaultWorkDir ?? '')
      setDefaultMode(settings.defaultMode ?? 'chat')
    })
  }, [])

  const save = async () => {
    const updates: Record<string, unknown> = { defaultWorkDir: workDir, defaultMode }
    if (apiKey) updates.apiKey = apiKey
    await window.api.settings.set(updates)
    setSaved(true)
    setTimeout(() => { setSaved(false); onClose() }, 800)
  }

  const browseWorkDir = async () => {
    const folder = await window.api.dialog.openFolder()
    if (folder) setWorkDir(folder)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>⚙️ Settings</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="setting-group">
            <label>Anthropic API Key</label>
            <input
              type="password"
              className="setting-input"
              placeholder="sk-ant-..."
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
            />
            <p className="setting-hint">
              Stored locally in app data. Never transmitted except to api.anthropic.com.
              Get your key at <a href="#" onClick={() => window.open?.('https://console.anthropic.com')}>console.anthropic.com</a>
            </p>
          </div>

          <div className="setting-group">
            <label>Default Work Directory</label>
            <div className="setting-row">
              <input
                type="text"
                className="setting-input"
                value={workDir}
                onChange={e => setWorkDir(e.target.value)}
                placeholder="/Users/carl/Documents/ClientFiles"
              />
              <button className="browse-btn" onClick={browseWorkDir}>Browse</button>
            </div>
          </div>

          <div className="setting-group">
            <label>Default Mode</label>
            <div className="mode-radio">
              <label>
                <input type="radio" value="chat" checked={defaultMode === 'chat'} onChange={() => setDefaultMode('chat')} />
                Chat — Conversational, files attached as context
              </label>
              <label>
                <input type="radio" value="agent" checked={defaultMode === 'agent'} onChange={() => setDefaultMode('agent')} />
                Agent — Autonomous file read/write access
              </label>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={save}>
            {saved ? '✓ Saved!' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}
