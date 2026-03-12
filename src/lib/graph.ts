import type { ParsedFile, GraphData, GraphNode, GraphLink } from '../types'

function resolveWikilinkToId(
  wikilink: string,
  nodeIds: Set<string>
): string | null {
  const slug = wikilink.toLowerCase().replace(/\s+/g, '-')
  if (nodeIds.has(slug)) return slug
  for (const id of nodeIds) {
    const name = id.split('/').pop()!
    if (name === slug) return id
  }
  return null
}

export function buildGraph(files: ParsedFile[]): GraphData {
  const nodeIds = new Set(files.map((f) => f.id))
  const connectionCount = new Map<string, number>()

  const links: GraphLink[] = []
  const seen = new Set<string>()

  for (const file of files) {
    // Premise links
    for (const premise of file.premises) {
      if (nodeIds.has(premise)) {
        const key = `${premise}->${file.id}`
        if (!seen.has(key)) {
          seen.add(key)
          links.push({ source: premise, target: file.id })
          connectionCount.set(premise, (connectionCount.get(premise) ?? 0) + 1)
          connectionCount.set(file.id, (connectionCount.get(file.id) ?? 0) + 1)
        }
      }
    }

    // Wikilink links
    for (const wikilink of file.wikilinks) {
      const targetId = resolveWikilinkToId(wikilink, nodeIds)
      if (targetId && targetId !== file.id) {
        const key = `${file.id}->${targetId}`
        if (!seen.has(key)) {
          seen.add(key)
          links.push({ source: file.id, target: targetId })
          connectionCount.set(file.id, (connectionCount.get(file.id) ?? 0) + 1)
          connectionCount.set(
            targetId,
            (connectionCount.get(targetId) ?? 0) + 1
          )
        }
      }
    }
  }

  const nodes: GraphNode[] = files.map((file) => ({
    id: file.id,
    name: file.name,
    val: 1 + (connectionCount.get(file.id) ?? 0),
    isAxiomatic: file.premises.length === 0,
    body: file.body,
    premises: file.premises,
    wikilinks: file.wikilinks,
  }))

  return { nodes, links }
}
