import { create } from 'zustand'

export type AgentMode = 'chat' | 'agent'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface ToolCall {
  id: string
  name: string
  input: Record<string, unknown>
  result?: string
  status: 'running' | 'done' | 'error'
  timestamp: Date
}

export interface AttachedFile {
  path: string
  name: string
  ext: string
  extractedText?: string
}

interface AppState {
  // ─── Conversation ──────────────────────────────────────────────────────────
  messages: Message[]
  toolCalls: ToolCall[]
  isRunning: boolean
  mode: AgentMode
  currentSessionId: string | null
  streamingText: string

  // ─── Files ─────────────────────────────────────────────────────────────────
  attachedFiles: AttachedFile[]
  workDirectory: string

  // ─── UI ────────────────────────────────────────────────────────────────────
  sidebarTab: 'files' | 'tools' | 'prompts'
  showSettings: boolean

  // ─── Actions ───────────────────────────────────────────────────────────────
  setMode: (mode: AgentMode) => void
  addMessage: (msg: Omit<Message, 'id' | 'timestamp'>) => void
  appendStreamText: (text: string) => void
  finalizeStream: () => void
  addToolCall: (tc: Omit<ToolCall, 'timestamp'>) => void
  updateToolCall: (id: string, updates: Partial<ToolCall>) => void
  setRunning: (running: boolean, sessionId?: string) => void
  attachFile: (file: AttachedFile) => void
  removeFile: (path: string) => void
  clearConversation: () => void
  setWorkDirectory: (dir: string) => void
  setSidebarTab: (tab: 'files' | 'tools' | 'prompts') => void
  setShowSettings: (show: boolean) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  messages: [],
  toolCalls: [],
  isRunning: false,
  mode: 'chat',
  currentSessionId: null,
  streamingText: '',
  attachedFiles: [],
  workDirectory: '',
  sidebarTab: 'files',
  showSettings: false,

  setMode: (mode) => set({ mode }),

  addMessage: (msg) => set((state) => ({
    messages: [...state.messages, {
      ...msg,
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      timestamp: new Date()
    }]
  })),

  appendStreamText: (text) => set((state) => ({
    streamingText: state.streamingText + text
  })),

  finalizeStream: () => {
    const { streamingText, addMessage } = get()
    if (streamingText.trim()) {
      addMessage({ role: 'assistant', content: streamingText })
    }
    set({ streamingText: '', isRunning: false, currentSessionId: null })
  },

  addToolCall: (tc) => set((state) => ({
    toolCalls: [...state.toolCalls, { ...tc, timestamp: new Date() }]
  })),

  updateToolCall: (id, updates) => set((state) => ({
    toolCalls: state.toolCalls.map(tc => tc.id === id ? { ...tc, ...updates } : tc)
  })),

  setRunning: (running, sessionId) => set({
    isRunning: running,
    currentSessionId: sessionId ?? null,
    streamingText: running ? '' : get().streamingText
  }),

  attachFile: (file) => set((state) => ({
    attachedFiles: [...state.attachedFiles.filter(f => f.path !== file.path), file]
  })),

  removeFile: (path) => set((state) => ({
    attachedFiles: state.attachedFiles.filter(f => f.path !== path)
  })),

  clearConversation: () => set({
    messages: [],
    toolCalls: [],
    streamingText: '',
    isRunning: false,
    currentSessionId: null
  }),

  setWorkDirectory: (dir) => set({ workDirectory: dir }),
  setSidebarTab: (tab) => set({ sidebarTab: tab }),
  setShowSettings: (show) => set({ showSettings: show })
}))
