// Skill registry — maps skill metadata to their markdown files
// Add a new entry here whenever you add a new skill file

export type Jurisdiction = 'FL' | 'PA' | 'BOTH'
export type DocCategory = 'deed' | 'trust' | 'poa' | 'will' | 'healthcare' | 'medicaid' | 'general'

export interface SkillMeta {
  id: string               // unique identifier used in code
  label: string            // display name in UI
  filename: string         // markdown file in this folder
  jurisdiction: Jurisdiction
  category: DocCategory
  formId?: string          // links to a structured intake form
  description: string
}

export const SKILLS: SkillMeta[] = [
  // ─── Florida Estate Planning ─────────────────────────────────────────────
  {
    id: 'fl-lady-bird-deed',
    label: 'FL Lady Bird Deed',
    filename: 'fl-lady-bird-deed.md',
    jurisdiction: 'FL',
    category: 'deed',
    formId: 'fl-lady-bird-deed',
    description: 'Florida Enhanced Life Estate (Lady Bird) Deed'
  },
  {
    id: 'fl-durable-poa',
    label: 'FL Durable POA',
    filename: 'fl-durable-poa.md',
    jurisdiction: 'FL',
    category: 'poa',
    formId: 'fl-durable-poa',
    description: 'Florida Durable Power of Attorney (Ch. 709)'
  },
  {
    id: 'fl-healthcare-surrogate',
    label: 'FL Healthcare Surrogate',
    filename: 'fl-healthcare-surrogate.md',
    jurisdiction: 'FL',
    category: 'healthcare',
    formId: 'fl-healthcare-surrogate',
    description: 'Florida Designation of Health Care Surrogate'
  },
  {
    id: 'fl-revocable-trust',
    label: 'FL Revocable Trust',
    filename: 'fl-revocable-trust.md',
    jurisdiction: 'FL',
    category: 'trust',
    formId: 'fl-revocable-trust',
    description: 'Florida Single Person Revocable Living Trust'
  },
  {
    id: 'fl-will',
    label: 'FL Last Will',
    filename: 'fl-will.md',
    jurisdiction: 'FL',
    category: 'will',
    formId: 'fl-will',
    description: 'Florida Last Will and Testament'
  },
  // ─── Florida Medicaid ─────────────────────────────────────────────────────
  {
    id: 'fl-medicaid-icp',
    label: 'FL ICP Medicaid Screen',
    filename: 'fl-medicaid-icp.md',
    jurisdiction: 'FL',
    category: 'medicaid',
    formId: 'fl-medicaid-icp',
    description: 'Florida Institutional Care Program Medicaid Eligibility'
  },
  {
    id: 'fl-qit',
    label: 'FL Qualified Income Trust',
    filename: 'fl-qit.md',
    jurisdiction: 'FL',
    category: 'medicaid',
    formId: 'fl-qit',
    description: 'Florida QIT / Miller Trust Drafting'
  },
  // ─── Pennsylvania Estate Planning ────────────────────────────────────────
  {
    id: 'pa-durable-poa',
    label: 'PA Durable POA',
    filename: 'pa-durable-poa.md',
    jurisdiction: 'PA',
    category: 'poa',
    formId: 'pa-durable-poa',
    description: 'Pennsylvania Durable Power of Attorney (POA Act 2014)'
  },
  {
    id: 'pa-healthcare-poa',
    label: 'PA Healthcare POA',
    filename: 'pa-healthcare-poa.md',
    jurisdiction: 'PA',
    category: 'healthcare',
    formId: 'pa-healthcare-poa',
    description: 'Pennsylvania Health Care Power of Attorney'
  },
  {
    id: 'pa-revocable-trust',
    label: 'PA Revocable Trust',
    filename: 'pa-revocable-trust.md',
    jurisdiction: 'PA',
    category: 'trust',
    formId: 'pa-revocable-trust',
    description: 'Pennsylvania Single Person Revocable Living Trust'
  },
  {
    id: 'pa-will',
    label: 'PA Last Will',
    filename: 'pa-will.md',
    jurisdiction: 'PA',
    category: 'will',
    formId: 'pa-will',
    description: 'Pennsylvania Last Will and Testament'
  },
  // ─── Pennsylvania Medicaid ────────────────────────────────────────────────
  {
    id: 'pa-medicaid-ma-ltc',
    label: 'PA MA-LTC Screen',
    filename: 'pa-medicaid-ma-ltc.md',
    jurisdiction: 'PA',
    category: 'medicaid',
    formId: 'pa-medicaid-ma-ltc',
    description: 'Pennsylvania Medical Assistance Long-Term Care Eligibility'
  },
  // ─── Document Review ──────────────────────────────────────────────────────
  {
    id: 'will-review',
    label: 'Will Review',
    filename: 'will-review.md',
    jurisdiction: 'BOTH',
    category: 'will',
    description: 'Analyze an existing will for defects and gaps'
  },
  {
    id: 'poa-review',
    label: 'POA Review',
    filename: 'poa-review.md',
    jurisdiction: 'BOTH',
    category: 'poa',
    description: 'Analyze an existing POA for defects and gaps'
  },
  {
    id: 'trust-review',
    label: 'Trust Review',
    filename: 'trust-review.md',
    jurisdiction: 'BOTH',
    category: 'trust',
    description: 'Analyze an existing trust for defects and gaps'
  }
]

// Helper lookups
export const getSkillById = (id: string) => SKILLS.find(s => s.id === id)
export const getSkillsByCategory = (cat: DocCategory) => SKILLS.filter(s => s.category === cat)
export const getSkillsByJurisdiction = (j: Jurisdiction) => SKILLS.filter(s => s.jurisdiction === j || s.jurisdiction === 'BOTH')
export const getSkillsByForm = (formId: string) => SKILLS.find(s => s.formId === formId)
