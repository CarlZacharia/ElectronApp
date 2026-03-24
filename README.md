# Legal AI Desktop
### Zacharia Frey PLLC — Claude-Powered Document Analysis Tool

An Electron desktop application providing Claude AI with full filesystem access for legal document analysis, Medicaid eligibility screening, and estate planning workflow automation.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run in development
npm run dev

# 3. Build for production
npm run build && npm run dist
```

On first launch, go to **Settings (⚙️)** and enter your Anthropic API key.

---

## Architecture

```
src/
├── main/                    # Electron main process (Node.js)
│   ├── index.ts             # App entry, window creation
│   ├── claude/
│   │   └── agent.ts         # Core agentic loop with tool use
│   ├── tools/
│   │   ├── file-tools.ts    # read, write, list, search, open
│   │   └── doc-tools.ts     # PDF and DOCX text extraction
│   └── ipc/
│       ├── claude-handlers.ts   # IPC: claude:run, claude:cancel
│       ├── file-handlers.ts     # IPC: file:*, doc:*
│       ├── dialog-handlers.ts   # IPC: dialog:*, settings:*
│       └── settings-handlers.ts
├── preload/
│   └── index.ts             # Secure contextBridge (window.api)
└── renderer/                # React UI (Vite)
    ├── App.tsx
    ├── app.css
    ├── store/
    │   └── appStore.ts      # Zustand state management
    ├── hooks/
    │   └── useClaude.ts     # Main Claude IPC hook
    └── components/
        ├── TopBar.tsx        # Mode switcher + quick prompts
        ├── Sidebar.tsx       # File browser + templates
        ├── ChatPane.tsx      # Conversation UI with streaming
        ├── ToolLog.tsx       # Agent tool call activity log
        ├── AttachedFiles.tsx # File attachment chips
        └── SettingsModal.tsx # API key + preferences
```

---

## Two Modes

### 💬 Chat Mode
- Attach PDF/DOCX files from the sidebar
- Text is extracted automatically and sent as context
- Streaming responses with full conversation history
- No filesystem writes — safe for client review

### 🤖 Agent Mode
- Claude can autonomously read files, extract documents,
  write output files, list directories, and search
- Tool calls shown in real-time in the Agent Activity panel
- Use for batch analysis, document drafting, folder processing
- Safety limit: 20 tool iterations max

---

## Legal Quick Prompts

Pre-built prompts in the sidebar for:
- Will & Trust Review
- POA Analysis
- Florida ICP Medicaid Screening
- Pennsylvania MA-LTC Screening
- Spend-Down Planning
- Lady Bird Deed Drafting
- Client Letters

---

## Adding Custom Tools

To add a new tool (e.g., `run_ocr`):

1. Add tool definition in `src/main/claude/agent.ts` → `TOOLS[]`
2. Implement in `src/main/tools/`
3. Add to the dispatcher in `agent.ts` → `executeTool()`
4. Add icon in `ToolLog.tsx` → `TOOL_ICONS`

---

## Security Notes

- API key stored in OS user data directory (`app.getPath('userData')`)
- `contextIsolation: true`, `nodeIntegration: false` — renderer has no direct Node access
- All Node/filesystem calls go through IPC via typed `window.api`
- Content Security Policy set in `index.html`

---

## Dependencies

| Package | Purpose |
|---|---|
| `@anthropic-ai/sdk` | Claude API client |
| `electron-vite` | Build tooling |
| `zustand` | State management |
| `pdf-parse` | PDF text extraction |
| `mammoth` | DOCX text extraction |
| `glob` | File search patterns |
| `chokidar` | Folder watching (optional) |
