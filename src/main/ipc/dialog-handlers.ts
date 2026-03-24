import { IpcMain, BrowserWindow, dialog, app } from 'electron'
import path from 'path'
import fs from 'fs/promises'

// ─── Dialog Handlers ───────────────────────────────────────────────────────────

export function registerDialogHandlers(
  ipcMain: IpcMain,
  getWindow: () => BrowserWindow | null
): void {

  ipcMain.handle('dialog:open-file', async (_, options: {
    filters?: { name: string; extensions: string[] }[]
    multiple?: boolean
  }) => {
    const win = getWindow()
    if (!win) return null

    const result = await dialog.showOpenDialog(win, {
      properties: options.multiple ? ['openFile', 'multiSelections'] : ['openFile'],
      filters: options.filters ?? [
        { name: 'Documents', extensions: ['pdf', 'docx', 'doc', 'txt', 'md'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })

    return result.canceled ? null : (options.multiple ? result.filePaths : result.filePaths[0])
  })

  ipcMain.handle('dialog:open-folder', async () => {
    const win = getWindow()
    if (!win) return null

    const result = await dialog.showOpenDialog(win, {
      properties: ['openDirectory']
    })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('dialog:save-file', async (_, options: {
    defaultName?: string
    filters?: { name: string; extensions: string[] }[]
  }) => {
    const win = getWindow()
    if (!win) return null

    const result = await dialog.showSaveDialog(win, {
      defaultPath: options.defaultName,
      filters: options.filters ?? [
        { name: 'Word Document', extensions: ['docx'] },
        { name: 'Text File', extensions: ['txt'] },
        { name: 'Markdown', extensions: ['md'] }
      ]
    })
    return result.canceled ? null : result.filePath
  })
}

// ─── Settings Handlers ─────────────────────────────────────────────────────────

interface AppSettings {
  apiKey: string
  defaultWorkDir: string
  model: string
  defaultMode: 'chat' | 'agent'
}

const DEFAULT_SETTINGS: AppSettings = {
  apiKey: '',
  defaultWorkDir: app.getPath('documents'),
  model: 'claude-sonnet-4-20250514',
  defaultMode: 'chat'
}

let _settings: AppSettings = { ...DEFAULT_SETTINGS }
const SETTINGS_PATH = path.join(app.getPath('userData'), 'settings.json')

async function loadSettings(): Promise<void> {
  try {
    const raw = await fs.readFile(SETTINGS_PATH, 'utf-8')
    _settings = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    _settings = { ...DEFAULT_SETTINGS }
  }
}

async function saveSettings(settings: Partial<AppSettings>): Promise<void> {
  _settings = { ..._settings, ...settings }
  await fs.writeFile(SETTINGS_PATH, JSON.stringify(_settings, null, 2), 'utf-8')
}

export function getSettings(): AppSettings {
  return _settings
}

export function registerSettingsHandlers(ipcMain: IpcMain): void {
  // Load settings on startup
  loadSettings()

  ipcMain.handle('settings:get', () => {
    return { ..._settings, apiKey: _settings.apiKey ? '••••••••' : '' }
  })

  ipcMain.handle('settings:set', async (_, updates: Partial<AppSettings>) => {
    await saveSettings(updates)
    return { success: true }
  })

  ipcMain.handle('settings:get-api-key-set', () => {
    return { isSet: Boolean(_settings.apiKey) }
  })
}
