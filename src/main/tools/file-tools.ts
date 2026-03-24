import fs from 'fs/promises'
import path from 'path'
import { shell } from 'electron'
import { glob } from 'glob'

export async function executeFileTool(
  name: string,
  input: Record<string, unknown>
): Promise<string> {
  switch (name) {
    case 'read_file': {
      const filePath = input.path as string
      try {
        const content = await fs.readFile(filePath, 'utf-8')
        const lines = content.split('\n').length
        return `[File: ${path.basename(filePath)} — ${lines} lines]\n\n${content}`
      } catch (err) {
        throw new Error(`Cannot read file at "${filePath}": ${(err as Error).message}`)
      }
    }

    case 'write_file': {
      const filePath = input.path as string
      const content = input.content as string
      try {
        await fs.mkdir(path.dirname(filePath), { recursive: true })
        await fs.writeFile(filePath, content, 'utf-8')
        const bytes = Buffer.byteLength(content, 'utf8')
        return `✓ Written ${bytes.toLocaleString()} bytes to: ${filePath}`
      } catch (err) {
        throw new Error(`Cannot write file at "${filePath}": ${(err as Error).message}`)
      }
    }

    case 'list_directory': {
      const dirPath = input.path as string
      try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true })
        const sorted = entries.sort((a, b) => {
          // Directories first, then files
          if (a.isDirectory() && !b.isDirectory()) return -1
          if (!a.isDirectory() && b.isDirectory()) return 1
          return a.name.localeCompare(b.name)
        })
        const lines = sorted.map(e => {
          const icon = e.isDirectory() ? '📁' : getFileIcon(e.name)
          return `${icon} ${e.name}${e.isDirectory() ? '/' : ''}`
        })
        return `Contents of ${dirPath} (${entries.length} items):\n\n${lines.join('\n')}`
      } catch (err) {
        throw new Error(`Cannot list directory "${dirPath}": ${(err as Error).message}`)
      }
    }

    case 'search_files': {
      const directory = input.directory as string
      const pattern = input.pattern as string
      try {
        const files = await glob(pattern, {
          cwd: directory,
          absolute: true,
          nodir: true
        })
        if (files.length === 0) return `No files found matching "${pattern}" in ${directory}`
        return `Found ${files.length} file(s):\n\n${files.join('\n')}`
      } catch (err) {
        throw new Error(`Search failed: ${(err as Error).message}`)
      }
    }

    case 'open_file': {
      const filePath = input.path as string
      try {
        await shell.openPath(filePath)
        return `✓ Opened ${path.basename(filePath)} with system default application`
      } catch (err) {
        throw new Error(`Cannot open file: ${(err as Error).message}`)
      }
    }

    default:
      throw new Error(`Unknown file tool: ${name}`)
  }
}

function getFileIcon(filename: string): string {
  const ext = path.extname(filename).toLowerCase()
  const icons: Record<string, string> = {
    '.pdf': '📄',
    '.docx': '📝',
    '.doc': '📝',
    '.txt': '📃',
    '.md': '📃',
    '.json': '⚙️',
    '.xlsx': '📊',
    '.xls': '📊',
    '.png': '🖼️',
    '.jpg': '🖼️',
    '.jpeg': '🖼️'
  }
  return icons[ext] ?? '📎'
}
