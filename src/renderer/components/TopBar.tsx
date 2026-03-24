import { useAppStore } from '../store/appStore'
import { AppTab } from '../App'

interface Props {
  activeTab: AppTab
  onTabChange: (tab: AppTab) => void
}

const QUICK_PROMPTS = [
  { label: 'Analyze Will', prompt: 'Please analyze the attached will document and identify any issues, missing provisions, or items requiring attention.' },
  { label: 'FL Medicaid Screen', prompt: 'Please perform a Florida ICP Medicaid eligibility screening based on the attached intake documents.' },
  { label: 'PA Medicaid Screen', prompt: 'Please perform a Pennsylvania MA-LTC eligibility screening based on the attached intake documents.' },
  { label: 'Draft Trust Summary', prompt: 'Please provide a plain-English summary of the attached trust document suitable for a client meeting.' }
]

export default function TopBar({ activeTab, onTabChange }: Props) {
  const { mode, setMode, clearConversation, setShowSettings, isRunning } = useAppStore()

  return (
    <header className="top-bar">
      <div className="top-bar-left">
        <div className="app-logo">
          <span className="logo-icon">⚖️</span>
          <span className="logo-text">Legal AI Desktop</span>
          <span className="logo-firm">Zacharia Frey PLLC</span>
        </div>
      </div>

      <div className="top-bar-center">
        {/* Main app tab switcher */}
        <div className="app-tabs">
          <button
            className={`app-tab ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => onTabChange('chat')}
          >
            💬 Chat
          </button>
          <button
            className={`app-tab ${activeTab === 'forms' ? 'active' : ''}`}
            onClick={() => onTabChange('forms')}
          >
            📋 Draft Documents
          </button>
          <button
            className={`app-tab ${activeTab === 'skills' ? 'active' : ''}`}
            onClick={() => onTabChange('skills')}
          >
            🛠 Skill Templates
          </button>
        </div>

        {/* Chat-only controls */}
        {activeTab === 'chat' && (
          <>
            <div className="mode-switcher">
              <button
                className={`mode-btn ${mode === 'chat' ? 'active' : ''}`}
                onClick={() => setMode('chat')}
                disabled={isRunning}
                title="Chat mode: files attached as context"
              >
                <span className="mode-icon">💬</span> Chat
              </button>
              <button
                className={`mode-btn ${mode === 'agent' ? 'active' : ''}`}
                onClick={() => setMode('agent')}
                disabled={isRunning}
                title="Agent mode: Claude reads/writes files autonomously"
              >
                <span className="mode-icon">🤖</span> Agent
              </button>
            </div>

            <div className="quick-prompts">
              {QUICK_PROMPTS.map(qp => (
                <button
                  key={qp.label}
                  className="quick-prompt-btn"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('quick-prompt', { detail: qp.prompt }))
                  }}
                  disabled={isRunning}
                  title={qp.prompt}
                >
                  {qp.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="top-bar-right">
        {activeTab === 'chat' && (
          <button className="icon-btn" onClick={clearConversation} title="New conversation" disabled={isRunning}>
            ✨
          </button>
        )}
        <button className="icon-btn" onClick={() => setShowSettings(true)} title="Settings">
          ⚙️
        </button>
      </div>
    </header>
  )
}

