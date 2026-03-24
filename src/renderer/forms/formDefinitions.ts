// Form field definitions for each document type
// These drive the structured intake forms in the UI

export type FieldType =
  | 'text'
  | 'textarea'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'checkboxgroup'
  | 'date'
  | 'repeater'   // dynamic list of items (e.g. multiple beneficiaries)

export interface FieldOption {
  value: string
  label: string
}

export interface FormField {
  id: string
  label: string
  type: FieldType
  required?: boolean
  placeholder?: string
  options?: FieldOption[]
  fields?: FormField[]        // for repeater type — sub-fields
  hint?: string               // helper text shown under field
  dependsOn?: {               // show this field only if...
    field: string
    value: string | boolean
  }
}

export interface FormSection {
  title: string
  fields: FormField[]
}

export interface FormDefinition {
  id: string
  skillId: string
  title: string
  sections: FormSection[]
}

// ─── Shared field blocks ───────────────────────────────────────────────────────

const PERSON_FIELDS = (prefix: string, label: string): FormField[] => [
  { id: `${prefix}_full_name`, label: `${label} Full Legal Name`, type: 'text', required: true },
  { id: `${prefix}_address`, label: `${label} Address`, type: 'textarea', placeholder: '123 Main St\nNaples, FL 34102' },
  { id: `${prefix}_county`, label: `${label} County`, type: 'text', placeholder: 'Collier' }
]

const WITNESS_FIELDS: FormSection = {
  title: 'Witnesses',
  fields: [
    { id: 'witness_1_name', label: 'Witness 1 Printed Name', type: 'text' },
    { id: 'witness_1_address', label: 'Witness 1 Address', type: 'text' },
    { id: 'witness_2_name', label: 'Witness 2 Printed Name', type: 'text' },
    { id: 'witness_2_address', label: 'Witness 2 Address', type: 'text' }
  ]
}

const NOTARY_FIELDS: FormSection = {
  title: 'Notary',
  fields: [
    { id: 'notary_name', label: 'Notary Printed Name', type: 'text' },
    { id: 'notary_commission_exp', label: 'Commission Expiration', type: 'date' },
    { id: 'execution_date', label: 'Date of Execution', type: 'date' }
  ]
}

const OUTPUT_FIELDS: FormSection = {
  title: 'Output',
  fields: [
    {
      id: 'output_path',
      label: 'Save Draft To (optional)',
      type: 'text',
      placeholder: 'C:\\ClientFiles\\Smith\\lady-bird-deed-draft.txt',
      hint: 'Leave blank to display in chat only'
    }
  ]
}

// ─── Form Definitions ─────────────────────────────────────────────────────────

export const FORMS: FormDefinition[] = [

  // ── FL Lady Bird Deed ──────────────────────────────────────────────────────
  {
    id: 'fl-lady-bird-deed',
    skillId: 'fl-lady-bird-deed',
    title: 'Florida Lady Bird Deed',
    sections: [
      {
        title: 'Grantor Information',
        fields: [
          ...PERSON_FIELDS('grantor', 'Grantor'),
          {
            id: 'grantor_marital_status',
            label: 'Marital Status',
            type: 'select',
            required: true,
            options: [
              { value: 'single', label: 'Single' },
              { value: 'married', label: 'Married' },
              { value: 'widowed', label: 'Widowed' },
              { value: 'divorced', label: 'Divorced' }
            ]
          },
          {
            id: 'spouse_full_name',
            label: 'Spouse Full Name (if joining)',
            type: 'text',
            dependsOn: { field: 'grantor_marital_status', value: 'married' }
          }
        ]
      },
      {
        title: 'Property',
        fields: [
          { id: 'property_address', label: 'Property Address', type: 'textarea', required: true },
          { id: 'property_county', label: 'Property County', type: 'text', required: true },
          { id: 'parcel_id', label: 'Parcel ID (Folio Number)', type: 'text' },
          {
            id: 'legal_description',
            label: 'Legal Description',
            type: 'textarea',
            required: true,
            placeholder: 'Verbatim from prior deed or title search',
            hint: 'Must be exact — copy verbatim from vesting deed or title search'
          },
          {
            id: 'is_homestead',
            label: 'Is this homestead property?',
            type: 'checkbox',
            hint: 'If yes and grantor is married, spouse must join'
          }
        ]
      },
      {
        title: 'Remainder Beneficiaries',
        fields: [
          {
            id: 'remainder_beneficiaries',
            label: 'Remainder Beneficiaries',
            type: 'repeater',
            hint: 'Who inherits the property when grantor dies',
            fields: [
              { id: 'name', label: 'Full Legal Name', type: 'text', required: true },
              { id: 'relationship', label: 'Relationship to Grantor', type: 'text' },
              { id: 'address', label: 'Address', type: 'text' }
            ]
          },
          {
            id: 'alternate_beneficiary',
            label: 'Alternate Beneficiary (if primary predeceases grantor)',
            type: 'text'
          }
        ]
      },
      WITNESS_FIELDS,
      NOTARY_FIELDS,
      OUTPUT_FIELDS
    ]
  },

  // ── FL Durable POA ─────────────────────────────────────────────────────────
  {
    id: 'fl-durable-poa',
    skillId: 'fl-durable-poa',
    title: 'Florida Durable Power of Attorney',
    sections: [
      {
        title: 'Principal',
        fields: PERSON_FIELDS('principal', 'Principal')
      },
      {
        title: 'Agent (Attorney-in-Fact)',
        fields: [
          ...PERSON_FIELDS('agent', 'Agent'),
          { id: 'agent_relationship', label: 'Relationship to Principal', type: 'text' }
        ]
      },
      {
        title: 'Successor Agent',
        fields: [
          { id: 'successor_agent_name', label: 'Successor Agent Name', type: 'text' },
          { id: 'successor_agent_address', label: 'Successor Agent Address', type: 'textarea' }
        ]
      },
      {
        title: 'Powers Granted',
        fields: [
          {
            id: 'powers',
            label: 'Standard Powers',
            type: 'checkboxgroup',
            options: [
              { value: 'real_property', label: 'Real property transactions' },
              { value: 'personal_property', label: 'Tangible personal property transactions' },
              { value: 'stocks_bonds', label: 'Stock and bond transactions' },
              { value: 'banking', label: 'Banking and financial institution transactions' },
              { value: 'business', label: 'Business operating transactions' },
              { value: 'insurance', label: 'Insurance and annuity transactions' },
              { value: 'estate_trust', label: 'Estate, trust, and beneficiary transactions' },
              { value: 'claims', label: 'Claims and litigation' },
              { value: 'personal_family', label: 'Personal and family maintenance' },
              { value: 'government_benefits', label: 'Government programs / civil or military service' },
              { value: 'retirement', label: 'Retirement plan transactions' },
              { value: 'tax', label: 'Tax matters' }
            ]
          },
          {
            id: 'gift_authority',
            label: 'Grant gift-giving authority?',
            type: 'checkbox',
            hint: 'Requires explicit grant under Florida law'
          },
          {
            id: 'gift_limit',
            label: 'Annual gift limit per donee',
            type: 'text',
            placeholder: '$18,000',
            dependsOn: { field: 'gift_authority', value: true }
          },
          {
            id: 'trust_authority',
            label: 'Grant trust creation/amendment authority?',
            type: 'checkbox',
            hint: 'Requires explicit grant under Florida law'
          }
        ]
      },
      WITNESS_FIELDS,
      NOTARY_FIELDS,
      OUTPUT_FIELDS
    ]
  },

  // ── FL Will ────────────────────────────────────────────────────────────────
  {
    id: 'fl-will',
    skillId: 'fl-will',
    title: 'Florida Last Will and Testament',
    sections: [
      {
        title: 'Testator',
        fields: [
          ...PERSON_FIELDS('testator', 'Testator'),
          {
            id: 'marital_status',
            label: 'Marital Status',
            type: 'select',
            required: true,
            options: [
              { value: 'single', label: 'Single' },
              { value: 'married', label: 'Married' },
              { value: 'widowed', label: 'Widowed' },
              { value: 'divorced', label: 'Divorced' }
            ]
          },
          { id: 'spouse_name', label: 'Spouse Full Name', type: 'text', dependsOn: { field: 'marital_status', value: 'married' } }
        ]
      },
      {
        title: 'Children',
        fields: [
          {
            id: 'children',
            label: 'Children',
            type: 'repeater',
            fields: [
              { id: 'name', label: 'Full Name', type: 'text', required: true },
              { id: 'dob', label: 'Date of Birth', type: 'date' },
              { id: 'relationship', label: 'Relationship', type: 'select', options: [{ value: 'biological', label: 'Biological' }, { value: 'adopted', label: 'Adopted' }, { value: 'stepchild', label: 'Stepchild' }] }
            ]
          }
        ]
      },
      {
        title: 'Personal Representative',
        fields: [
          ...PERSON_FIELDS('pr', 'Personal Representative'),
          { id: 'pr_relationship', label: 'Relationship to Testator', type: 'text' },
          { id: 'successor_pr_name', label: 'Successor PR Name', type: 'text' },
          { id: 'successor_pr_address', label: 'Successor PR Address', type: 'textarea' }
        ]
      },
      {
        title: 'Bequests',
        fields: [
          {
            id: 'specific_bequests',
            label: 'Specific Bequests',
            type: 'repeater',
            hint: 'Specific items or amounts to specific people',
            fields: [
              { id: 'description', label: 'Item / Amount', type: 'text' },
              { id: 'beneficiary', label: 'Beneficiary', type: 'text' }
            ]
          },
          { id: 'residuary_beneficiary', label: 'Residuary Beneficiary', type: 'text', required: true, hint: 'Who gets everything else' },
          { id: 'alternate_residuary', label: 'Alternate Residuary Beneficiary', type: 'text' },
          {
            id: 'pour_over_trust',
            label: 'Pour-over to revocable trust?',
            type: 'checkbox',
            hint: 'Residue passes to testator\'s revocable living trust'
          },
          { id: 'trust_name', label: 'Trust Name', type: 'text', dependsOn: { field: 'pour_over_trust', value: true } }
        ]
      },
      {
        title: 'Guardian (if minor children)',
        fields: [
          { id: 'guardian_name', label: 'Guardian Full Name', type: 'text' },
          { id: 'guardian_address', label: 'Guardian Address', type: 'textarea' }
        ]
      },
      WITNESS_FIELDS,
      NOTARY_FIELDS,
      OUTPUT_FIELDS
    ]
  },

  // ── PA Durable POA ─────────────────────────────────────────────────────────
  {
    id: 'pa-durable-poa',
    skillId: 'pa-durable-poa',
    title: 'Pennsylvania Durable Power of Attorney',
    sections: [
      {
        title: 'Principal',
        fields: PERSON_FIELDS('principal', 'Principal')
      },
      {
        title: 'Agent',
        fields: [
          ...PERSON_FIELDS('agent', 'Agent'),
          { id: 'agent_relationship', label: 'Relationship to Principal', type: 'text' }
        ]
      },
      {
        title: 'Successor Agent',
        fields: [
          { id: 'successor_agent_name', label: 'Successor Agent Name', type: 'text' },
          { id: 'successor_agent_address', label: 'Successor Agent Address', type: 'textarea' }
        ]
      },
      {
        title: 'Powers Granted',
        fields: [
          {
            id: 'powers',
            label: 'Powers',
            type: 'checkboxgroup',
            options: [
              { value: 'real_property', label: 'Real property transactions' },
              { value: 'personal_property', label: 'Tangible personal property' },
              { value: 'stocks_bonds', label: 'Stocks and bonds' },
              { value: 'banking', label: 'Banking transactions' },
              { value: 'business', label: 'Business operations' },
              { value: 'insurance', label: 'Insurance and annuities' },
              { value: 'estate_trust', label: 'Estate and trust matters' },
              { value: 'claims', label: 'Claims and litigation' },
              { value: 'government_benefits', label: 'Government benefits / Medicaid' },
              { value: 'retirement', label: 'Retirement plans' },
              { value: 'tax', label: 'Tax matters' },
              { value: 'personal_family', label: 'Personal and family maintenance' }
            ]
          },
          {
            id: 'gift_authority',
            label: 'Grant gift-giving authority?',
            type: 'checkbox',
            hint: 'Requires explicit grant under PA POA Act'
          },
          {
            id: 'gift_limit',
            label: 'Annual gift limit',
            type: 'text',
            placeholder: '$18,000 per donee',
            dependsOn: { field: 'gift_authority', value: true }
          },
          {
            id: 'trust_authority',
            label: 'Grant trust creation/amendment authority?',
            type: 'checkbox'
          }
        ]
      },
      {
        title: 'Witnesses',
        fields: [
          { id: 'witness_1_name', label: 'Witness 1 Printed Name', type: 'text', hint: 'Cannot be agent or agent\'s relative' },
          { id: 'witness_2_name', label: 'Witness 2 Printed Name', type: 'text' }
        ]
      },
      NOTARY_FIELDS,
      OUTPUT_FIELDS
    ]
  }
]

export const getFormById = (id: string) => FORMS.find(f => f.id === id)
export const getFormBySkill = (skillId: string) => FORMS.find(f => f.skillId === skillId)

// ── Additional forms appended ──────────────────────────────────────────────────

FORMS.push(

  // FL Healthcare Surrogate
  {
    id: 'fl-healthcare-surrogate',
    skillId: 'fl-healthcare-surrogate',
    title: 'Florida Designation of Health Care Surrogate',
    sections: [
      { title: 'Principal', fields: PERSON_FIELDS('principal', 'Principal') },
      {
        title: 'Surrogate',
        fields: [
          ...PERSON_FIELDS('surrogate', 'Surrogate'),
          { id: 'surrogate_relationship', label: 'Relationship to Principal', type: 'text' as const },
          { id: 'alt_surrogate_name', label: 'Alternate Surrogate Name', type: 'text' as const },
          { id: 'alt_surrogate_address', label: 'Alternate Surrogate Address', type: 'textarea' as const }
        ]
      },
      {
        title: 'Living Will / End-of-Life',
        fields: [
          { id: 'living_will_included', label: 'Include living will provisions?', type: 'checkbox' as const },
          { id: 'withhold_life_support', label: 'Withhold life-prolonging procedures if no reasonable recovery?', type: 'checkbox' as const, dependsOn: { field: 'living_will_included', value: true } },
          { id: 'withhold_nutrition', label: 'Withhold artificial nutrition/hydration?', type: 'checkbox' as const, dependsOn: { field: 'living_will_included', value: true } },
          { id: 'dnr_preference', label: 'DNR preference', type: 'select' as const, options: [{ value: 'not_addressed', label: 'Not addressed' }, { value: 'dnr', label: 'Do Not Resuscitate' }, { value: 'full_code', label: 'Full resuscitation' }] }
        ]
      },
      { title: 'Witnesses', fields: [{ id: 'witness_1_name', label: 'Witness 1 Printed Name', type: 'text' as const }, { id: 'witness_2_name', label: 'Witness 2 Printed Name (must be non-relative)', type: 'text' as const }] },
      NOTARY_FIELDS, OUTPUT_FIELDS
    ]
  },

  // PA Healthcare POA
  {
    id: 'pa-healthcare-poa',
    skillId: 'pa-healthcare-poa',
    title: 'Pennsylvania Health Care Power of Attorney',
    sections: [
      { title: 'Principal', fields: PERSON_FIELDS('principal', 'Principal') },
      { title: 'Health Care Agent', fields: [...PERSON_FIELDS('agent', 'Agent'), { id: 'agent_relationship', label: 'Relationship to Principal', type: 'text' as const }, { id: 'alt_agent_name', label: 'Alternate Agent Name', type: 'text' as const }, { id: 'alt_agent_address', label: 'Alternate Agent Address', type: 'textarea' as const }] },
      {
        title: 'Advance Directive',
        fields: [
          { id: 'living_will_included', label: 'Include advance directive provisions?', type: 'checkbox' as const },
          { id: 'withhold_life_sustaining', label: 'Withhold life-sustaining treatment if no reasonable recovery?', type: 'checkbox' as const, dependsOn: { field: 'living_will_included', value: true } },
          { id: 'withhold_nutrition', label: 'Withhold artificial nutrition/hydration?', type: 'checkbox' as const, dependsOn: { field: 'living_will_included', value: true } },
          { id: 'organ_donation', label: 'Organ donation', type: 'select' as const, options: [{ value: 'not_addressed', label: 'Not addressed' }, { value: 'yes_any', label: 'Yes — any needed organs' }, { value: 'no', label: 'No' }] }
        ]
      },
      { title: 'Witnesses', fields: [{ id: 'witness_1_name', label: 'Witness 1 Printed Name', type: 'text' as const, hint: 'Cannot be agent, agent\'s relative, or principal\'s heir' }, { id: 'witness_2_name', label: 'Witness 2 Printed Name', type: 'text' as const }] },
      NOTARY_FIELDS, OUTPUT_FIELDS
    ]
  },

  // FL Revocable Trust
  {
    id: 'fl-revocable-trust',
    skillId: 'fl-revocable-trust',
    title: 'Florida Revocable Living Trust',
    sections: [
      { title: 'Grantor / Trustee', fields: [...PERSON_FIELDS('grantor', 'Grantor'), { id: 'trust_name', label: 'Trust Name', type: 'text' as const, required: true, placeholder: 'The John Smith Revocable Living Trust' }] },
      { title: 'Successor Trustees', fields: [...PERSON_FIELDS('successor_trustee', 'Successor Trustee'), { id: 'second_successor_name', label: 'Second Successor Name', type: 'text' as const }, { id: 'second_successor_address', label: 'Second Successor Address', type: 'textarea' as const }] },
      {
        title: 'Distribution at Death',
        fields: [
          { id: 'primary_beneficiary', label: 'Primary Beneficiary', type: 'text' as const, required: true },
          { id: 'alternate_beneficiary', label: 'Alternate Beneficiary', type: 'text' as const },
          { id: 'distribution_scheme', label: 'Distribution Scheme', type: 'select' as const, required: true, options: [{ value: 'outright', label: 'Outright at death' }, { value: 'age_based', label: 'Age-based distribution' }, { value: 'protective', label: 'Continuing protective trust' }] },
          { id: 'age_terms', label: 'Age Distribution Terms', type: 'textarea' as const, placeholder: 'e.g. 1/3 at 25, 1/3 at 30, balance at 35', dependsOn: { field: 'distribution_scheme', value: 'age_based' } }
        ]
      },
      { title: 'Homestead', fields: [{ id: 'homestead_in_trust', label: 'Will homestead property be transferred to trust?', type: 'checkbox' as const }, { id: 'grantor_married', label: 'Is grantor married?', type: 'checkbox' as const }] },
      NOTARY_FIELDS, OUTPUT_FIELDS
    ]
  },

  // PA Revocable Trust
  {
    id: 'pa-revocable-trust',
    skillId: 'pa-revocable-trust',
    title: 'Pennsylvania Revocable Living Trust',
    sections: [
      { title: 'Grantor / Trustee', fields: [...PERSON_FIELDS('grantor', 'Grantor'), { id: 'trust_name', label: 'Trust Name', type: 'text' as const, required: true }, { id: 'grantor_county', label: 'County of Execution', type: 'text' as const }] },
      { title: 'Successor Trustees', fields: [...PERSON_FIELDS('successor_trustee', 'Successor Trustee'), { id: 'second_successor_name', label: 'Second Successor Name', type: 'text' as const }, { id: 'incapacity_standard', label: 'Incapacity Standard', type: 'select' as const, options: [{ value: 'two_physicians', label: 'Two licensed physicians' }, { value: 'one_physician', label: 'One licensed physician' }, { value: 'court', label: 'Court adjudication' }] }] },
      { title: 'Distribution at Death', fields: [{ id: 'primary_beneficiary', label: 'Primary Beneficiary', type: 'text' as const, required: true }, { id: 'alternate_beneficiary', label: 'Alternate Beneficiary', type: 'text' as const }, { id: 'distribution_scheme', label: 'Distribution Scheme', type: 'select' as const, options: [{ value: 'outright', label: 'Outright at death' }, { value: 'age_based', label: 'Age-based' }, { value: 'protective', label: 'Protective trust' }] }] },
      NOTARY_FIELDS, OUTPUT_FIELDS
    ]
  },

  // FL QIT
  {
    id: 'fl-qit',
    skillId: 'fl-qit',
    title: 'Florida Qualified Income Trust (QIT / Miller Trust)',
    sections: [
      { title: 'Beneficiary (Medicaid Applicant)', fields: [...PERSON_FIELDS('beneficiary', 'Beneficiary'), { id: 'facility_name', label: 'Nursing Facility Name', type: 'text' as const }, { id: 'gross_monthly_income', label: 'Gross Monthly Income', type: 'text' as const, required: true, hint: 'Must exceed income cap ($2,901/mo for 2024 — verify)' }] },
      { title: 'Income Sources', fields: [{ id: 'income_sources', label: 'Income Sources', type: 'repeater' as const, fields: [{ id: 'source', label: 'Source (e.g. Social Security)', type: 'text' as const }, { id: 'amount', label: 'Monthly Amount', type: 'text' as const }] }] },
      { title: 'Trustee', fields: [...PERSON_FIELDS('trustee', 'Trustee'), { id: 'trustee_relationship', label: 'Relationship to Beneficiary', type: 'text' as const, required: true }, { id: 'successor_trustee', label: 'Successor Trustee Name', type: 'text' as const }] },
      { title: 'Community Spouse', fields: [{ id: 'has_community_spouse', label: 'Is there a community spouse?', type: 'checkbox' as const }, { id: 'spouse_name', label: 'Community Spouse Name', type: 'text' as const, dependsOn: { field: 'has_community_spouse', value: true } }, { id: 'mmmna', label: 'MMMNA Amount', type: 'text' as const, dependsOn: { field: 'has_community_spouse', value: true } }] },
      NOTARY_FIELDS, OUTPUT_FIELDS
    ]
  },

  // PA Will
  {
    id: 'pa-will',
    skillId: 'pa-will',
    title: 'Pennsylvania Last Will and Testament',
    sections: [
      { title: 'Testator', fields: [...PERSON_FIELDS('testator', 'Testator'), { id: 'testator_county', label: 'County of Residence', type: 'text' as const }, { id: 'marital_status', label: 'Marital Status', type: 'select' as const, required: true, options: [{ value: 'single', label: 'Single' }, { value: 'married', label: 'Married' }, { value: 'widowed', label: 'Widowed' }, { value: 'divorced', label: 'Divorced' }] }, { id: 'spouse_name', label: 'Spouse Name', type: 'text' as const, dependsOn: { field: 'marital_status', value: 'married' } }] },
      { title: 'Children', fields: [{ id: 'children', label: 'Children', type: 'repeater' as const, fields: [{ id: 'name', label: 'Full Name', type: 'text' as const }, { id: 'dob', label: 'Date of Birth', type: 'date' as const }] }] },
      { title: 'Executor', fields: [...PERSON_FIELDS('executor', 'Executor'), { id: 'executor_relationship', label: 'Relationship to Testator', type: 'text' as const }, { id: 'alt_executor_name', label: 'Alternate Executor Name', type: 'text' as const }] },
      { title: 'Bequests', fields: [{ id: 'specific_bequests', label: 'Specific Bequests', type: 'repeater' as const, fields: [{ id: 'description', label: 'Item/Amount', type: 'text' as const }, { id: 'beneficiary', label: 'Beneficiary', type: 'text' as const }] }, { id: 'residuary_beneficiary', label: 'Residuary Beneficiary', type: 'text' as const, required: true }, { id: 'alternate_residuary', label: 'Alternate Residuary', type: 'text' as const }, { id: 'pour_over_trust', label: 'Pour-over to revocable trust?', type: 'checkbox' as const }, { id: 'trust_name', label: 'Trust Name', type: 'text' as const, dependsOn: { field: 'pour_over_trust', value: true } }] },
      { title: 'Witnesses', fields: [{ id: 'witness_1_name', label: 'Witness 1 Printed Name', type: 'text' as const }, { id: 'witness_2_name', label: 'Witness 2 Printed Name', type: 'text' as const }] },
      NOTARY_FIELDS, OUTPUT_FIELDS
    ]
  }
)
