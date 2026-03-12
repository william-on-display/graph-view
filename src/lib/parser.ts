import type { ParsedFile } from '../types'

const WIKILINK_RE = /\[\[([^\]]+)\]\]/g
const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---/

function parseFrontmatter(raw: string): { data: Record<string, unknown>; content: string } {
  const match = raw.match(FRONTMATTER_RE)
  if (!match) return { data: {}, content: raw }

  const yaml = match[1]
  const content = raw.slice(match[0].length).trim()
  const data: Record<string, unknown> = {}

  let currentKey: string | null = null
  let currentList: string[] | null = null

  for (const line of yaml.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed === '---') continue

    // List item (e.g. "  - value")
    const listMatch = trimmed.match(/^-\s+(.+)/)
    if (listMatch && currentKey) {
      if (!currentList) currentList = []
      currentList.push(listMatch[1].trim())
      continue
    }

    // Flush previous list
    if (currentKey && currentList) {
      data[currentKey] = currentList
      currentList = null
    }

    // Key-value pair
    const kvMatch = trimmed.match(/^(\w[\w-]*)\s*:\s*(.*)/)
    if (kvMatch) {
      currentKey = kvMatch[1]
      const value = kvMatch[2].trim()
      if (value === '' || value === '[]') {
        // Might be followed by list items
        data[currentKey] = []
      } else {
        data[currentKey] = value
        currentKey = null
      }
    }
  }

  // Flush final list
  if (currentKey && currentList) {
    data[currentKey] = currentList
  }

  return { data, content }
}

function extractTitle(content: string, fallbackName: string): string {
  const match = content.match(/^#\s+(.+)$/m)
  return match ? match[1].trim() : fallbackName
}

function extractWikilinks(content: string): string[] {
  const links: string[] = []
  let match
  while ((match = WIKILINK_RE.exec(content)) !== null) {
    links.push(match[1].trim())
  }
  return [...new Set(links)]
}

function filePathToId(path: string): string {
  return path
    .replace(/^\/content\//, '')
    .replace(/\.md$/, '')
}

export function parseFile(filePath: string, raw: string): ParsedFile {
  const { data: frontmatter, content } = parseFrontmatter(raw)
  const id = filePathToId(filePath)
  const fallbackName = id.split('/').pop()!.replace(/-/g, ' ')
  const name = extractTitle(content, fallbackName)
  const premises: string[] = (
    Array.isArray(frontmatter.premises) ? frontmatter.premises : []
  ).map((p: string) => p.replace(/\.md$/, ''))
  const wikilinks = extractWikilinks(content)

  const category = typeof frontmatter.category === 'string' ? frontmatter.category : 'uncategorized'

  return { id, name, category, body: content.trim(), premises, wikilinks }
}

export function parseAllFiles(files: Record<string, string>): ParsedFile[] {
  return Object.entries(files).map(([path, raw]) => parseFile(path, raw))
}
