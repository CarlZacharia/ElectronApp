import { IpcMain } from 'electron'
import { executeFileTool } from '../tools/file-tools'
import { executeDocTool } from '../tools/doc-tools'
import fs from 'fs/promises'

export function registerFileHandlers(ipcMain: IpcMain): void {

  ipcMain.handle('file:read', async (_, path: string) => {
    return executeFileTool('read_file', { path })
  })

  ipcMain.handle('file:write', async (_, path: string, content: string) => {
    return executeFileTool('write_file', { path, content })
  })

  ipcMain.handle('file:list', async (_, path: string) => {
    return executeFileTool('list_directory', { path })
  })

  ipcMain.handle('file:search', async (_, directory: string, pattern: string) => {
    return executeFileTool('search_files', { directory, pattern })
  })

  ipcMain.handle('file:open', async (_, path: string) => {
    return executeFileTool('open_file', { path })
  })

  ipcMain.handle('doc:extract-pdf', async (_, path: string) => {
    return executeDocTool('extract_pdf', { path })
  })

  ipcMain.handle('doc:extract-docx', async (_, path: string) => {
    return executeDocTool('extract_docx', { path })
  })

  ipcMain.handle('file:stat', async (_, path: string) => {
    try {
      const stat = await fs.stat(path)
      return {
        size: stat.size,
        modified: stat.mtime.toISOString(),
        isDirectory: stat.isDirectory(),
        isFile: stat.isFile()
      }
    } catch {
      return null
    }
  })
}
