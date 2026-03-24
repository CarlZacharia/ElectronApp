import { contextBridge, ipcRenderer } from 'electron'

// Type-safe API exposed to the renderer process
const api = {
  // ─── Claude AI ──────────────────────────────────────────────────────────────
  claude: {
    run: (messages: unknown[], mode: 'chat' | 'agent', sessionId: string) =>
      ipcRenderer.invoke('claude:run', { messages, mode, sessionId }),

    cancel: () => ipcRenderer.invoke('claude:cancel'),

    onText: (callback: (data: { text: string; done: boolean; sessionId: string }) => void) => {
      const handler = (_: unknown, data: unknown) => callback(data as { text: string; done: boolean; sessionId: string })
      ipcRenderer.on('claude:text', handler)
      return () => ipcRenderer.removeListener('claude:text', handler)
    },

    onToolCall: (callback: (data: unknown) => void) => {
      const handler = (_: unknown, data: unknown) => callback(data)
      ipcRenderer.on('claude:tool-call', handler)
      return () => ipcRenderer.removeListener('claude:tool-call', handler)
    },

    onError: (callback: (data: { error: string; sessionId: string }) => void) => {
      const handler = (_: unknown, data: unknown) => callback(data as { error: string; sessionId: string })
      ipcRenderer.on('claude:error', handler)
      return () => ipcRenderer.removeListener('claude:error', handler)
    }
  },

  // ─── File System ────────────────────────────────────────────────────────────
  file: {
    read: (path: string) => ipcRenderer.invoke('file:read', path),
    write: (path: string, content: string) => ipcRenderer.invoke('file:write', path, content),
    list: (path: string) => ipcRenderer.invoke('file:list', path),
    search: (directory: string, pattern: string) => ipcRenderer.invoke('file:search', directory, pattern),
    open: (path: string) => ipcRenderer.invoke('file:open', path),
    stat: (path: string) => ipcRenderer.invoke('file:stat', path)
  },

  // ─── Document Extraction ────────────────────────────────────────────────────
  doc: {
    extractPdf: (path: string) => ipcRenderer.invoke('doc:extract-pdf', path),
    extractDocx: (path: string) => ipcRenderer.invoke('doc:extract-docx', path)
  },

  // ─── Dialogs ────────────────────────────────────────────────────────────────
  dialog: {
    openFile: (options?: {
      filters?: { name: string; extensions: string[] }[]
      multiple?: boolean
    }) => ipcRenderer.invoke('dialog:open-file', options ?? {}),

    openFolder: () => ipcRenderer.invoke('dialog:open-folder'),

    saveFile: (options?: {
      defaultName?: string
      filters?: { name: string; extensions: string[] }[]
    }) => ipcRenderer.invoke('dialog:save-file', options ?? {})
  },

  // ─── Settings ───────────────────────────────────────────────────────────────
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    set: (updates: Record<string, unknown>) => ipcRenderer.invoke('settings:set', updates),
    getApiKeySet: () => ipcRenderer.invoke('settings:get-api-key-set')
  },

  // ─── Skills ─────────────────────────────────────────────────────────────────
  skills: {
    list: () => ipcRenderer.invoke('skills:list'),
    load: (skillId: string) => ipcRenderer.invoke('skills:load', skillId),
    save: (skillId: string, content: string) =>
      ipcRenderer.invoke('skills:save', skillId, content),
    draft: (payload: {
      skillId: string
      formData: Record<string, unknown>
      sessionId: string
      outputPath?: string
    }) => ipcRenderer.invoke('skills:draft', payload)
  }
}

contextBridge.exposeInMainWorld('api', api)

// TypeScript declaration for renderer
export type ElectronAPI = typeof api
