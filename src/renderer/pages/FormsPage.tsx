import { useState } from 'react'
import { SKILLS, SkillMeta, DocCategory } from '../../skills/index'
import { FORMS } from '../forms/formDefinitions'
import DocumentForm from '../components/forms/DocumentForm'
import { useAppStore } from '../store/appStore'
import { useClaude } from '../hooks/useClaude'

const CATEGORIES: { id: DocCategory; label: string; icon: string }[] = [
  { id: 'deed', label: 'Deeds', icon: '🏠' },
  { id: 'poa', label: 'Powers of Attorney', icon: '✍️' },
  { id: 'will', label: 'Wills', icon: '📜' },
  { id: 'trust', label: 'Trusts', icon: '🏦' },
  { id: 'healthcare', label: 'Healthcare Directives', icon: '🏥' },
  { id: 'medicaid', label: 'Medicaid', icon: '💊' }
]

export default function FormsPage() {
  const [selectedCategory, setSelectedCategory] = useState<DocCategory | null>(null)
  const [selectedSkill, setSelectedSkill] = useState<SkillMeta | null>(null)
  const { isRunning, messages, streamingText } = useAppStore()

  const filteredSkills = selectedCategory
    ? SKILLS.filter(s => s.category === selectedCategory && FORMS.find(f => f.skillId === s.id))
    : SKILLS.filter(s => FORMS.find(f => f.skillId === s.id))

  const selectedForm = selectedSkill
    ? FORMS.find(f => f.skillId === selectedSkill.id)
    : null

  const handleFormSubmit = async (formData: Record<string, unknown>) => {
    if (!selectedSkill) return

    const sessionId = `form-${Date.now()}`
    useAppStore.getState().setRunning(true, sessionId)
    useAppStore.getState().clearConversation()

    const outputPath = formData.output_path as string | undefined
    const dataWithoutOutput = { ...formData }
    delete dataWithoutOutput.output_path

    try {
      await (window.api as unknown as {
        skills: {
          draft: (payload: {
            skillId: string
            formData: Record<string, unknown>
            sessionId: string
            outputPath?: string
          }) => Promise<void>
        }
      }).skills.draft({
        skillId: selectedSkill.id,
        formData: dataWithoutOutput,
        sessionId,
        outputPath: outputPath || undefined
      })
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="forms-page">
      {/* Left: Document type selector */}
      <div className="forms-selector">
        <div className="selector-header">Document Drafting</div>

        <div className="category-list">
          <button
            className={`category-btn ${!selectedCategory ? 'active' : ''}`}
            onClick={() => setSelectedCategory(null)}
          >
            All Documents
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className={`category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        <div className="skill-list">
          {filteredSkills.map(skill => (
            <button
              key={skill.id}
              className={`skill-btn ${selectedSkill?.id === skill.id ? 'active' : ''}`}
              onClick={() => setSelectedSkill(skill)}
            >
              <div className="skill-btn-label">{skill.label}</div>
              <div className="skill-btn-desc">{skill.description}</div>
              <div className={`skill-jurisdiction ${skill.jurisdiction.toLowerCase()}`}>
                {skill.jurisdiction}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right: Form or output */}
      <div className="forms-main">
        {!selectedSkill && (
          <div className="forms-empty">
            <div className="empty-icon">📋</div>
            <h2>Document Drafting</h2>
            <p>Select a document type from the left to begin.</p>
            <p>Complete the intake form and Claude will draft the document using your firm's template.</p>
          </div>
        )}

        {selectedSkill && selectedForm && !isRunning && messages.length === 0 && (
          <div className="form-wrapper">
            <DocumentForm
              form={selectedForm}
              onSubmit={handleFormSubmit}
              isRunning={isRunning}
            />
          </div>
        )}

        {(isRunning || messages.length > 0) && (
          <div className="form-output">
            <div className="output-header">
              <button
                className="back-btn"
                onClick={() => {
                  useAppStore.getState().clearConversation()
                  useAppStore.getState().setRunning(false)
                }}
                disabled={isRunning}
              >
                ← Back to Form
              </button>
              <span className="output-title">
                {isRunning ? '⏳ Drafting...' : '✅ Draft Complete'}
              </span>
            </div>

            <div className="output-content">
              {messages.map(msg => (
                <div key={msg.id} className={`output-message ${msg.role}`}>
                  {msg.content}
                </div>
              ))}
              {isRunning && streamingText && (
                <div className="output-message streaming">{streamingText}</div>
              )}
              {isRunning && !streamingText && (
                <div className="output-thinking">
                  <span className="typing-indicator"><span /><span /><span /></span>
                  Drafting document...
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
