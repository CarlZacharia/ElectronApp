import { IpcMain, BrowserWindow } from 'electron'
import { runClaudeAgent, AgentMode, ToolCallEvent } from '../claude/agent'
import Anthropic from '@anthropic-ai/sdk'
import { getSettings } from './settings-handlers'

// Track active abort controllers per window
const activeAgents = new Map<number, AbortController>()

export function registerClaudeHandlers(
  ipcMain: IpcMain,
  getWindow: () => BrowserWindow | null
): void {

  // Start a Claude session (chat or agent)
  ipcMain.handle('claude:run', async (event, payload: {
    messages: Anthropic.MessageParam[]
    mode: AgentMode
    sessionId: string
  }) => {
    const { messages, mode, sessionId } = payload
    const win = getWindow()
    if (!win) return { error: 'No window available' }

    const settings = getSettings()
    if (!settings.apiKey) {
      return { error: 'No API key configured. Please add your Anthropic API key in Settings.' }
    }

    // Cancel any existing agent for this window
    const windowId = win.webContents.id
    activeAgents.get(windowId)?.abort()
    const controller = new AbortController()
    activeAgents.set(windowId, controller)

    try {
      await runClaudeAgent(
        messages,
        mode,
        settings.apiKey,
        {
          onText: (text: string, done: boolean) => {
            win.webContents.send('claude:text', { text, done, sessionId })
          },
          onToolCall: (event: ToolCallEvent) => {
            win.webContents.send('claude:tool-call', { ...event, sessionId })
          },
          onError: (error: string) => {
            win.webContents.send('claude:error', { error, sessionId })
          }
        },
        controller.signal
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      win.webContents.send('claude:error', { error: message, sessionId })
      return { error: message }
    } finally {
      activeAgents.delete(windowId)
    }

    return { success: true }
  })

  // Cancel active agent
  ipcMain.handle('claude:cancel', (event) => {
    const win = getWindow()
    if (!win) return
    const windowId = win.webContents.id
    activeAgents.get(windowId)?.abort()
    activeAgents.delete(windowId)
    return { success: true }
  })
}
