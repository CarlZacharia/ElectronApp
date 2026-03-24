import path from 'path'
import fs from 'fs/promises'

export async function executeDocTool(
  name: string,
  input: Record<string, unknown>
): Promise<string> {
  switch (name) {
    case 'extract_pdf': {
      const filePath = input.path as string
      try {
        // Dynamic import to avoid issues with electron packaging
        const pdfParse = (await import('pdf-parse')).default
        const buffer = await fs.readFile(filePath)
        const data = await pdfParse(buffer)
        const pageCount = data.numpages
        const wordCount = data.text.split(/\s+/).filter(Boolean).length
        return [
          `[PDF: ${path.basename(filePath)}]`,
          `Pages: ${pageCount} | Words: ~${wordCount.toLocaleString()}`,
          ``,
          data.text.trim()
        ].join('\n')
      } catch (err) {
        throw new Error(`PDF extraction failed for "${filePath}": ${(err as Error).message}`)
      }
    }

    case 'extract_docx': {
      const filePath = input.path as string
      try {
        const mammoth = await import('mammoth')
        const result = await mammoth.extractRawText({ path: filePath })
        const wordCount = result.value.split(/\s+/).filter(Boolean).length
        const warnings = result.messages.length > 0
          ? `\n[Warnings: ${result.messages.map(m => m.message).join('; ')}]`
          : ''
        return [
          `[DOCX: ${path.basename(filePath)}]`,
          `Words: ~${wordCount.toLocaleString()}${warnings}`,
          ``,
          result.value.trim()
        ].join('\n')
      } catch (err) {
        throw new Error(`DOCX extraction failed for "${filePath}": ${(err as Error).message}`)
      }
    }

    default:
      throw new Error(`Unknown doc tool: ${name}`)
  }
}
