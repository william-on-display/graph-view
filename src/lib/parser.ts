import matter from 'gray-matter'
import type { ParsedFile } from '../types'

const WIKILINK_RE = /\[\[([^\]]+)\]\]/g

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
  const { data: frontmatter, content } = matter(raw)
  const id = filePathToId(filePath)
  const fallbackName = id.split('/').pop()!.replace(/-/g, ' ')
  const name = extractTitle(content, fallbackName)
  const premises: string[] = (frontmatter.premises ?? []).map((p: string) =>
    p.replace(/\.md$/, '')
  )
  const wikilinks = extractWikilinks(content)

  return { id, name, body: content.trim(), premises, wikilinks }
}

export function parseAllFiles(files: Record<string, string>): ParsedFile[] {
  return Object.entries(files).map(([path, raw]) => parseFile(path, raw))
}
