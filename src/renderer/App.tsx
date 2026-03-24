import { useEffect, useState } from 'react'
import { useAppStore } from './store/appStore'
import ChatPane from './components/ChatPane'
import Sidebar from './components/Sidebar'
import ToolLog from './components/ToolLog'
import TopBar from './components/TopBar'
import SettingsModal from './components/SettingsModal'
import FormsPage from './pages/FormsPage'
import SkillEditorPage from './pages/SkillEditorPage'
import './app.css'

export type AppTab = 'chat' | 'forms' | 'skills'

export default function App() {
  const { showSettings, setWorkDirectory } = useAppStore()
  const [apiKeySet, setApiKeySet] = useState(false)
  const [activeTab, setActiveTab] = useState<AppTab>('chat')

  useEffect(() => {
    window.api.settings.get().then((s) => {
      const settings = s as { defaultWorkDir?: string }
      if (settings.defaultWorkDir) setWorkDirectory(settings.defaultWorkDir)
    })
    window.api.settings.getApiKeySet().then(({ isSet }) => setApiKeySet(isSet))
  }, [])

  const banner = !apiKeySet && (
    <div className="api-key-banner">
      <span>⚠️ No API key configured.</span>
      <button onClick={() => useAppStore.getState().setShowSettings(true)}>Open Settings</button>
    </div>
  )

  return (
    <div className="app-root">
      <TopBar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="app-body">

        <div style={{ display: activeTab === 'chat' ? 'contents' : 'none' }}>
          <Sidebar />
          <main className="main-area">
            {banner}
            <ChatPane />
          </main>
          <ToolLog />
        </div>

        <div style={{ display: activeTab === 'forms' ? 'contents' : 'none' }}>
          <main className="main-area">
            {banner}
            <FormsPage />
          </main>
        </div>

        <div style={{ display: activeTab === 'skills' ? 'contents' : 'none' }}>
          <main className="main-area">
            <SkillEditorPage />
          </main>
        </div>

      </div>
      {showSettings && (
        <SettingsModal onClose={() => {
          useAppStore.getState().setShowSettings(false)
          window.api.settings.getApiKeySet().then(({ isSet }) => setApiKeySet(isSet))
        }} />
      )}
    </div>
  )
}
