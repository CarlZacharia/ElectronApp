import { useState } from 'react'
import { FormDefinition, FormField, FormSection } from '../forms/formDefinitions'

interface Props {
  form: FormDefinition
  onSubmit: (data: Record<string, unknown>) => void
  isRunning: boolean
}

export default function DocumentForm({ form, onSubmit, isRunning }: Props) {
  const [data, setData] = useState<Record<string, unknown>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = (id: string, value: unknown) => {
    setData(prev => ({ ...prev, [id]: value }))
    setErrors(prev => { const e = { ...prev }; delete e[id]; return e })
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    form.sections.forEach(section => {
      section.fields.forEach(field => {
        if (field.required && !data[field.id]) {
          newErrors[field.id] = `${field.label} is required`
        }
      })
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validate()) onSubmit(data)
  }

  const isVisible = (field: FormField): boolean => {
    if (!field.dependsOn) return true
    const depValue = data[field.dependsOn.field]
    return depValue === field.dependsOn.value
  }

  return (
    <div className="doc-form">
      <div className="doc-form-header">
        <h2>{form.title}</h2>
        <p className="form-subtitle">Complete the fields below. Required fields marked with *</p>
      </div>

      <div className="doc-form-body">
        {form.sections.map(section => (
          <FormSectionBlock
            key={section.title}
            section={section}
            data={data}
            errors={errors}
            onSet={set}
            isVisible={isVisible}
          />
        ))}
      </div>

      <div className="doc-form-footer">
        <button
          className="form-submit-btn"
          onClick={handleSubmit}
          disabled={isRunning}
        >
          {isRunning ? '⏳ Drafting...' : '⚖️ Draft Document'}
        </button>
        <p className="form-hint">
          Claude will use your firm's template and flag any missing information.
        </p>
      </div>
    </div>
  )
}

function FormSectionBlock({
  section, data, errors, onSet, isVisible
}: {
  section: FormSection
  data: Record<string, unknown>
  errors: Record<string, string>
  onSet: (id: string, value: unknown) => void
  isVisible: (field: FormField) => boolean
}) {
  return (
    <div className="form-section">
      <div className="form-section-title">{section.title}</div>
      <div className="form-section-fields">
        {section.fields.filter(isVisible).map(field => (
          <FieldRenderer
            key={field.id}
            field={field}
            value={data[field.id]}
            error={errors[field.id]}
            onChange={(val) => onSet(field.id, val)}
          />
        ))}
      </div>
    </div>
  )
}

function FieldRenderer({
  field, value, error, onChange
}: {
  field: FormField
  value: unknown
  error?: string
  onChange: (val: unknown) => void
}) {
  return (
    <div className={`form-field ${error ? 'has-error' : ''}`}>
      <label className="field-label">
        {field.label}
        {field.required && <span className="required">*</span>}
      </label>

      {field.type === 'text' && (
        <input
          type="text"
          className="field-input"
          value={(value as string) ?? ''}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder}
        />
      )}

      {field.type === 'textarea' && (
        <textarea
          className="field-input field-textarea"
          value={(value as string) ?? ''}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={3}
        />
      )}

      {field.type === 'date' && (
        <input
          type="date"
          className="field-input"
          value={(value as string) ?? ''}
          onChange={e => onChange(e.target.value)}
        />
      )}

      {field.type === 'select' && (
        <select
          className="field-input"
          value={(value as string) ?? ''}
          onChange={e => onChange(e.target.value)}
        >
          <option value="">Select...</option>
          {field.options?.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      )}

      {field.type === 'checkbox' && (
        <label className="field-checkbox">
          <input
            type="checkbox"
            checked={(value as boolean) ?? false}
            onChange={e => onChange(e.target.checked)}
          />
          <span>{field.hint ?? 'Yes'}</span>
        </label>
      )}

      {field.type === 'checkboxgroup' && (
        <div className="field-checkboxgroup">
          {field.options?.map(opt => (
            <label key={opt.value} className="field-checkbox">
              <input
                type="checkbox"
                checked={((value as string[]) ?? []).includes(opt.value)}
                onChange={e => {
                  const current = (value as string[]) ?? []
                  onChange(e.target.checked
                    ? [...current, opt.value]
                    : current.filter(v => v !== opt.value))
                }}
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      )}

      {field.type === 'repeater' && (
        <RepeaterField
          field={field}
          value={(value as Record<string, unknown>[]) ?? []}
          onChange={onChange}
        />
      )}

      {field.hint && field.type !== 'checkbox' && (
        <p className="field-hint">{field.hint}</p>
      )}
      {error && <p className="field-error">{error}</p>}
    </div>
  )
}

function RepeaterField({
  field, value, onChange
}: {
  field: FormField
  value: Record<string, unknown>[]
  onChange: (val: unknown) => void
}) {
  const addRow = () => onChange([...value, {}])
  const removeRow = (i: number) => onChange(value.filter((_, idx) => idx !== i))
  const setRow = (i: number, key: string, val: unknown) => {
    const updated = [...value]
    updated[i] = { ...updated[i], [key]: val }
    onChange(updated)
  }

  return (
    <div className="repeater-field">
      {value.map((row, i) => (
        <div key={i} className="repeater-row">
          <div className="repeater-row-header">
            <span>#{i + 1}</span>
            <button className="repeater-remove" onClick={() => removeRow(i)}>×</button>
          </div>
          {field.fields?.map(subField => (
            <div key={subField.id} className="repeater-sub-field">
              <label className="field-label-sm">{subField.label}</label>
              <input
                type="text"
                className="field-input"
                value={(row[subField.id] as string) ?? ''}
                onChange={e => setRow(i, subField.id, e.target.value)}
              />
            </div>
          ))}
        </div>
      ))}
      <button className="repeater-add" onClick={addRow}>+ Add {field.label}</button>
    </div>
  )
}
