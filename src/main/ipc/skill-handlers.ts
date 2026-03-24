import { IpcMain, BrowserWindow, app } from 'electron'
import { loadSkill, listAvailableSkills, buildDraftingSystemPrompt } from '../skills/skill-loader'
import { runClaudeAgent } from '../claude/agent'
import { getSettings } from './dialog-handlers'
import Anthropic from '@anthropic-ai/sdk'

export function registerSkillHandlers(
  ipcMain: IpcMain,
  getWindow: () => BrowserWindow | null
): void {

  // List all skills with their metadata
  ipcMain.handle('skills:list', () => {
    return listAvailableSkills()
  })

  // Load raw skill content (for display/editing)
  ipcMain.handle('skills:load', (_, skillId: string) => {
    return loadSkill(skillId)
  })

  // Save updated skill content (from template editor)
  ipcMain.handle('skills:save', (_, skillId: string, content: string) => {
    const { join } = require('path')
    const { writeFileSync } = require('fs')
    const meta = listAvailableSkills().find(s => s.id === skillId)
    if (!meta) return { success: false, error: 'Unknown skill' }
    const skillsDir = app.isPackaged
      ? join(process.resourcesPath, 'skills')
      : join(__dirname, '../../../skills')
    try {
      writeFileSync(join(skillsDir, meta.filename), content, 'utf-8')
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  // Run a form-based document draft
  // formData = structured object from the intake form
  ipcMain.handle('skills:draft', async (_, payload: {
    skillId: string
    formData: Record<string, unknown>
    sessionId: string
    outputPath?: string
  }) => {
    const { skillId, formData, sessionId, outputPath } = payload
    const win = getWindow()
    if (!win) return { error: 'No window' }

    const settings = getSettings()
    if (!settings.apiKey) return { error: 'No API key configured' }

    // Build system prompt from skill file
    const systemPrompt = buildDraftingSystemPrompt(skillId)

    // Build the user message from form data
    const userMessage = buildFormPrompt(formData)

    const messages: Anthropic.MessageParam[] = [
      { role: 'user', content: userMessage }
    ]

    // Add output path instruction if provided
    const agentMessages: Anthropic.MessageParam[] = outputPath
      ? [{ role: 'user', content: `${userMessage}\n\nAfter drafting, save the complete document to: ${outputPath}` }]
      : messages

    try {
      await runClaudeAgent(
        agentMessages,
        outputPath ? 'agent' : 'chat',  // agent mode if saving to disk
        settings.apiKey,
        {
          onText: (text, done) => {
            win.webContents.send('claude:text', { text, done, sessionId })
          },
          onToolCall: (event) => {
            win.webContents.send('claude:tool-call', { ...event, sessionId })
          },
          onError: (error) => {
            win.webContents.send('claude:error', { error, sessionId })
          }
        },
        undefined,  // signal
        systemPrompt  // pass the skill template as system prompt
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      win.webContents.send('claude:error', { error: message, sessionId })
    }

    return { success: true }
  })
}

// Convert form data object into a well-structured prompt
function buildFormPrompt(formData: Record<string, unknown>): string {
  const lines = ['Please draft this document using the following client information:\n']

  for (const [key, value] of Object.entries(formData)) {
    if (value === null || value === undefined || value === '') continue

    // Format the key nicely
    const label = key
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .toUpperCase()

    if (Array.isArray(value)) {
      lines.push(`${label}:`)
      value.forEach((v, i) => lines.push(`  ${i + 1}. ${v}`))
    } else if (typeof value === 'boolean') {
      lines.push(`${label}: ${value ? 'YES' : 'NO'}`)
    } else {
      lines.push(`${label}: ${value}`)
    }
  }

  lines.push('\nPlease draft the complete document now, flagging any missing information.')
  return lines.join('\n')
}
