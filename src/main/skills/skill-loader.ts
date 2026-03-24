import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'
import { SKILLS, SkillMeta } from '../../skills/index'

// Resolve the skills directory whether running in dev or packaged
function getSkillsDir(): string {
  if (app.isPackaged) {
    // In production: skills are in resources/skills/ (via extraResources in package.json)
    return join(process.resourcesPath, 'skills')
  } else {
    // In development: read directly from src/skills/
    return join(__dirname, '../../src/skills')
  }
}

export function loadSkill(skillId: string): string {
  const meta = SKILLS.find(s => s.id === skillId)
  if (!meta) throw new Error(`Unknown skill: "${skillId}"`)

  const skillPath = join(getSkillsDir(), meta.filename)
  if (!existsSync(skillPath)) {
    throw new Error(`Skill file not found: ${meta.filename}`)
  }

  return readFileSync(skillPath, 'utf-8')
}

export function loadSkillsByCategory(category: string): string {
  const matching = SKILLS.filter(s => s.category === category)
  return matching.map(s => {
    try { return loadSkill(s.id) } catch { return '' }
  }).filter(Boolean).join('\n\n---\n\n')
}

export function getSkillMeta(skillId: string): SkillMeta | undefined {
  return SKILLS.find(s => s.id === skillId)
}

export function listAvailableSkills(): SkillMeta[] {
  const dir = getSkillsDir()
  return SKILLS.filter(s => existsSync(join(dir, s.filename)))
}

// Build the full system prompt for a document drafting session
export function buildDraftingSystemPrompt(skillId: string): string {
  const skillContent = loadSkill(skillId)
  const meta = getSkillMeta(skillId)

  return `You are a legal document drafting assistant for ${meta?.label ?? 'legal documents'}.
You are assisting Carl B. Zacharia, Esq., licensed in Florida (1994) and Pennsylvania (1993),
at Zacharia Frey PLLC, 26811 South Bay Drive Suite 270, Bonita Springs, FL 34134.

CRITICAL RULES:
- Use ONLY the template provided in the skill file below
- Do NOT improvise or substitute your own clause language
- Fill in ONLY the [TOKEN] placeholders with the provided client data
- If any required data is missing, insert [REQUIRED: description of missing item]
- Flag legal issues at the TOP of your output before the document
- Mark items needing attorney review as [REVIEW REQUIRED: reason]
- Never invent facts, dates, legal descriptions, or parcel IDs
- Output the complete document followed by a checklist of items needing attention

=== SKILL FILE: ${meta?.label} ===

${skillContent}

=== END SKILL FILE ===`
}
