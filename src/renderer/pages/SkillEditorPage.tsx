import { useState, useEffect } from 'react'
import { SKILLS, SkillMeta } from '../../skills/index'

// IPC to read/write skill files
declare global {
  interface Window {
    api: {
      skills: {
        list: () => Promise<SkillMeta[]>
        load: (skillId: string) => Promise<string>
        save: (skillId: string, content: string) => Promise<{ success: boolean }>
      }
      file: {
        write: (path: string, content: string) => Promise<string>
      }
      dialog: {
        openFile: (opts?: unknown) => Promise<string | null>
      }
    }
  }
}

const TEMPLATE_MARKER = '## OUTPUT TEMPLATE'
const TEMPLATE_PENDING = '[TEMPLATE PENDING — Carl to paste firm template here]'

export default function SkillEditorPage() {
  const [selectedSkill, setSelectedSkill] = useState<SkillMeta | null>(null)
  const [fullContent, setFullContent] = useState('')
  const [templateText, setTemplateText] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [hasTemplate, setHasTemplate] = useState(false)

  useEffect(() => {
    if (!selectedSkill) return
    loadSkill(selectedSkill.id)
  }, [selectedSkill])

  const loadSkill = async (id: string) => {
    // Clear previous skill's content immediately
    setFullContent('')
    setTemplateText('')
    setHasTemplate(false)
    try {
      const content = await window.api.skills.load(id)
      setFullContent(content)

      // Extract just the template portion for editing
      const markerIdx = content.indexOf(TEMPLATE_MARKER)
      if (markerIdx === -1) {
        setTemplateText('')
        setHasTemplate(false)
        return
      }

      const afterMarker = content.slice(markerIdx + TEMPLATE_MARKER.length)
      // Strip HTML comments if present
      const stripped = afterMarker
        .replace(/<!--[\s\S]*?-->/g, '')
        .trim()

      setTemplateText(stripped)
      setHasTemplate(stripped.length > 0 && !stripped.includes(TEMPLATE_PENDING))
    } catch (err) {
      console.error('Failed to load skill:', err)
    }
  }

  const handleSave = async () => {
    if (!selectedSkill) return
    setSaving(true)

    // Rebuild the full skill file: keep everything before ## OUTPUT TEMPLATE,
    // then append the new template
    const markerIdx = fullContent.indexOf(TEMPLATE_MARKER)
    const rulesSection = markerIdx !== -1
      ? fullContent.slice(0, markerIdx)
      : fullContent

    const newContent = `${rulesSection.trimEnd()}\n\n${TEMPLATE_MARKER}\n\n${templateText.trim()}\n`

    try {
      await window.api.skills.save(selectedSkill.id, newContent)
      setFullContent(newContent)
      setHasTemplate(templateText.trim().length > 0)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error('Save failed:', err)
      alert('Save failed. Check console for details.')
    } finally {
      setSaving(false)
    }
  }

  // Group skills for display
  const grouped = SKILLS.reduce((acc, skill) => {
    if (!acc[skill.category]) acc[skill.category] = []
    acc[skill.category].push(skill)
    return acc
  }, {} as Record<string, SkillMeta[]>)

  const categoryLabels: Record<string, string> = {
    deed: '🏠 Deeds',
    poa: '✍️ Powers of Attorney',
    will: '📜 Wills',
    trust: '🏦 Trusts',
    healthcare: '🏥 Healthcare Directives',
    medicaid: '💊 Medicaid',
    general: '📋 General'
  }

  return (
    <div className="skill-editor-page">
      {/* Left: skill selector */}
      <div className="skill-editor-nav">
        <div className="skill-editor-nav-header">Skill Templates</div>
        <div className="skill-editor-nav-hint">
          Select a skill to paste your firm's template into it.
        </div>
        {Object.entries(grouped).map(([cat, skills]) => (
          <div key={cat} className="skill-nav-group">
            <div className="skill-nav-cat">{categoryLabels[cat] ?? cat}</div>
            {skills.map(s => (
              <button
                key={s.id}
                className={`skill-nav-btn ${selectedSkill?.id === s.id ? 'active' : ''}`}
                onClick={() => setSelectedSkill(s)}
              >
                <span className={`skill-status-dot ${s.jurisdiction.toLowerCase()}`} />
                <span className="skill-nav-label">{s.label}</span>
                <span className={`skill-nav-jur ${s.jurisdiction.toLowerCase()}`}>
                  {s.jurisdiction}
                </span>
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Right: editor */}
      <div className="skill-editor-main">
        {!selectedSkill && (
          <div className="skill-editor-empty">
            <div className="empty-icon">✍️</div>
            <h2>Skill Template Editor</h2>
            <p>Select a skill from the left to edit its template.</p>
            <p>Paste your firm's document template and click Save. The template will be bundled into the app and used for all document drafting of that type.</p>
            <div className="editor-instructions">
              <h3>How to add your templates:</h3>
              <ol>
                <li>Open your existing firm template in Word</li>
                <li>Replace client-specific values with <code>[TOKEN_NAME]</code> placeholders</li>
                <li>Select the skill from the left panel</li>
                <li>Paste the modified template into the editor</li>
                <li>Click <strong>Save Template</strong></li>
              </ol>
            </div>
          </div>
        )}

        {selectedSkill && (
          <div className="skill-editor-content">
            <div className="skill-editor-header">
              <div>
                <h2>{selectedSkill.label}</h2>
                <p className="skill-editor-desc">{selectedSkill.description}</p>
              </div>
              <div className="skill-editor-header-actions">
                <span className={`template-status ${hasTemplate ? 'ready' : 'pending'}`}>
                  {hasTemplate ? '✅ Template loaded' : '⚠️ Template not yet added'}
                </span>
                <button
                  className="save-template-btn"
                  onClick={handleSave}
                  disabled={saving || !templateText.trim()}
                >
                  {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Template'}
                </button>
              </div>
            </div>

            <div className="skill-editor-body">
              {/* Rules section — read only preview */}
              <div className="skill-rules-panel">
                <div className="panel-label">Skill Rules (read-only)</div>
                <div className="skill-rules-content">
                  {fullContent.slice(0, fullContent.indexOf(TEMPLATE_MARKER) !== -1
                    ? fullContent.indexOf(TEMPLATE_MARKER)
                    : fullContent.length)}
                </div>
              </div>

              {/* Template editor */}
              <div className="skill-template-panel">
                <div className="panel-label">
                  Your Firm's Template
                  <span className="panel-hint"> — paste your document template here with [TOKEN] placeholders</span>
                </div>
                <textarea
                  className="skill-template-editor"
                  value={templateText}
                  onChange={e => setTemplateText(e.target.value)}
                  placeholder={`Paste your firm's ${selectedSkill.label} template here.

Replace all client-specific values with [TOKEN] placeholders.
For example:
  - Client name → [GRANTOR_FULL_NAME]
  - Address → [GRANTOR_ADDRESS]
  - Date → [EXECUTION_DATE]

See the Token Reference section in the rules panel for the full list of available tokens.`}
                  spellCheck={false}
                />
                <div className="template-char-count">
                  {templateText.length.toLocaleString()} characters
                  {templateText.length > 0 && ` · ~${Math.round(templateText.split(/\s+/).length / 1.3).toLocaleString()} words`}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
