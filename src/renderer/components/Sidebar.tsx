import { useState } from 'react'
import { useAppStore } from '../store/appStore'
import AttachedFiles from './AttachedFiles'

export default function Sidebar() {
  const { sidebarTab, setSidebarTab, workDirectory, setWorkDirectory, attachFile } = useAppStore()
  const [dirContents, setDirContents] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const browseFolder = async () => {
    const folder = await window.api.dialog.openFolder()
    if (folder) {
      setWorkDirectory(folder)
      loadDirectory(folder)
    }
  }

  const loadDirectory = async (path: string) => {
    setLoading(true)
    const result = await window.api.file.list(path)
    setDirContents(result)
    setLoading(false)
  }

  const attachFileFromDialog = async () => {
    const filePath = await window.api.dialog.openFile({
      filters: [
        { name: 'Legal Documents', extensions: ['pdf', 'docx', 'doc', 'txt', 'md'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    }) as string | null

    if (!filePath) return

    const name = filePath.split(/[\\/]/).pop() ?? filePath
    const ext = name.split('.').pop()?.toLowerCase() ?? ''

    let extractedText: string | undefined

    try {
      if (ext === 'pdf') {
        extractedText = await window.api.doc.extractPdf(filePath)
      } else if (ext === 'docx' || ext === 'doc') {
        extractedText = await window.api.doc.extractDocx(filePath)
      } else if (['txt', 'md', 'json'].includes(ext)) {
        extractedText = await window.api.file.read(filePath)
      }
    } catch (err) {
      console.error('Extraction error:', err)
    }

    attachFile({ path: filePath, name, ext, extractedText })
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-tabs">
        <button
          className={`sidebar-tab ${sidebarTab === 'files' ? 'active' : ''}`}
          onClick={() => setSidebarTab('files')}
        >
          📁 Files
        </button>
        <button
          className={`sidebar-tab ${sidebarTab === 'prompts' ? 'active' : ''}`}
          onClick={() => setSidebarTab('prompts')}
        >
          📋 Templates
        </button>
      </div>

      <div className="sidebar-content">
        {sidebarTab === 'files' && (
          <div className="file-panel">
            <div className="file-actions">
              <button className="sidebar-btn primary" onClick={attachFileFromDialog}>
                📎 Attach Document
              </button>
              <button className="sidebar-btn" onClick={browseFolder}>
                📂 Browse Folder
              </button>
            </div>

            <div className="attached-section">
              <div className="section-label">Attached to Conversation</div>
              <AttachedFiles />
            </div>

            {workDirectory && (
              <div className="folder-section">
                <div className="section-label">
                  Work Folder
                  <button
                    className="refresh-btn"
                    onClick={() => loadDirectory(workDirectory)}
                    title="Refresh"
                  >
                    🔄
                  </button>
                </div>
                <div className="folder-path" title={workDirectory}>
                  {workDirectory.split(/[\\/]/).pop()}
                </div>
                {loading ? (
                  <div className="loading-text">Loading...</div>
                ) : (
                  <pre className="dir-listing">{dirContents}</pre>
                )}
              </div>
            )}
          </div>
        )}

        {sidebarTab === 'prompts' && (
          <div className="prompts-panel">
            <TemplateList />
          </div>
        )}
      </div>
    </aside>
  )
}

const TEMPLATES = [
  {
    category: 'Estate Planning',
    items: [
      { label: 'Will Review', prompt: 'Please review the attached will and provide: (1) a summary of key provisions, (2) any execution defects, (3) missing standard provisions, (4) recommendations for updates.' },
      { label: 'Trust Analysis', prompt: 'Analyze the attached trust document and summarize: (1) trustee succession, (2) distribution standards, (3) asset protection provisions, (4) tax planning features.' },
      { label: 'POA Review', prompt: 'Review the attached Power of Attorney and identify: (1) scope of granted powers, (2) any missing Springing/Durable language, (3) PA or FL statutory compliance issues.' }
    ]
  },
  {
    category: 'Florida Medicaid',
    items: [
      { label: 'ICP Screen', prompt: 'Perform a complete Florida ICP Medicaid eligibility analysis. Check: (1) institutional status, (2) asset limit ($2,000), (3) income cap/QIT need, (4) lookback period, (5) planning opportunities.' },
      { label: 'QIT Draft', prompt: 'Draft a Florida Qualified Income Trust (Miller Trust) for a nursing home resident whose gross monthly income exceeds the income cap.' },
      { label: 'Transfer Penalty', prompt: 'Calculate the transfer penalty period based on the transfers disclosed. Use the current Florida penalty divisor and explain the penalty period.' }
    ]
  },
  {
    category: 'Pennsylvania Medicaid',
    items: [
      { label: 'MA-LTC Screen', prompt: 'Perform a Pennsylvania MA-LTC eligibility screening. Analyze: (1) asset limit, (2) income/patient liability, (3) CSRA if community spouse, (4) lookback transfers, (5) planning options.' },
      { label: 'Spend-Down Plan', prompt: 'Based on the attached intake, develop a PA Medicaid spend-down plan listing exempt assets, countable assets, spend-down amount, and recommended strategies.' }
    ]
  },
  {
    category: 'Document Drafting',
    items: [
      { label: 'Lady Bird Deed', prompt: 'Draft a Florida Enhanced Life Estate (Lady Bird) Deed. Include grantor/grantee info, legal description placeholder, proper reservation of rights, and all required Florida execution formalities (2 witnesses with printed names and addresses, notary).' },
      { label: 'Client Letter', prompt: 'Draft a professional client letter summarizing our estate planning recommendations based on the intake information provided.' }
    ]
  }
]

function TemplateList() {
  return (
    <div className="template-list">
      {TEMPLATES.map(cat => (
        <div key={cat.category} className="template-category">
          <div className="template-cat-label">{cat.category}</div>
          {cat.items.map(item => (
            <button
              key={item.label}
              className="template-btn"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('quick-prompt', { detail: item.prompt }))
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}
