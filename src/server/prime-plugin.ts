import type { Plugin } from 'vite'
import { loadRepoSource } from 'prime-md'
import { readFileSync } from 'node:fs'
import matter from 'gray-matter'
import * as path from 'node:path'

/**
 * Normalize GitHub tree URLs to repo-level URLs.
 * prime-md's GITHUB_TREE_RE greedily captures everything after /tree/ as the
 * ref, which breaks when the URL includes a subdirectory path
 * (e.g. /tree/main/examples/foo → ref becomes "main/examples/foo").
 * We strip the path portion and pass a clean repo URL instead.
 */
function normalizeSource(source: string): string {
  const treeMatch = source.match(
    /^(https:\/\/github\.com\/[^/]+\/[^/]+)\/tree\/([^/]+)(?:\/.+)?$/
  )
  if (treeMatch) {
    return `${treeMatch[1]}/tree/${treeMatch[2]}`
  }
  return source
}

export interface SerializedNode {
  id: string
  name: string
  body: string
  isAxiom: boolean
  category: string
  premises: string[]
}

export interface SerializedGraph {
  nodes: SerializedNode[]
  edges: { source: string; target: string }[]
  label: string
}

function extractCategory(node: { filePath: string; relativePath: string }): string {
  // Try reading frontmatter to get explicit category
  try {
    const raw = readFileSync(node.filePath, 'utf-8')
    const { data } = matter(raw)
    if (typeof data.category === 'string') return data.category
  } catch {
    // File might be remote/synthetic — fall through
  }

  // Derive from first directory segment of relativePath
  const segments = node.relativePath.split('/')
  if (segments.length > 1) return segments[0]

  return 'uncategorized'
}

export function primePlugin(): Plugin {
  return {
    name: 'prime-graph-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url!, `http://${req.headers.host}`)

        if (url.pathname !== '/api/graph') return next()

        const source = normalizeSource(url.searchParams.get('source') || './content')

        try {
          const { nodes, remoteNodes, label } = await loadRepoSource(source)
          const allNodes = [...nodes, ...remoteNodes]

          // Build a filePath→id mapping (use relativePath as id, without .md)
          const filePathToId = new Map<string, string>()
          for (const node of allNodes) {
            const id = node.relativePath.replace(/\.md$/, '')
            filePathToId.set(node.filePath, id)
          }

          // Also map resolvedPaths to ids
          for (const node of allNodes) {
            for (const premise of node.premises) {
              if (premise.resolvedPath && !filePathToId.has(premise.resolvedPath)) {
                // Try to find the node by resolved path
                const target = allNodes.find(n => n.filePath === premise.resolvedPath)
                if (target) {
                  filePathToId.set(premise.resolvedPath, target.relativePath.replace(/\.md$/, ''))
                }
              }
            }
          }

          const serializedNodes: SerializedNode[] = allNodes.map((node) => {
            const id = node.relativePath.replace(/\.md$/, '')
            const premiseIds: string[] = []
            for (const p of node.premises) {
              if (p.resolvedPath) {
                const targetId = filePathToId.get(p.resolvedPath)
                if (targetId) premiseIds.push(targetId)
              }
            }

            return {
              id,
              name: node.claim || id.split('/').pop()!.replace(/-/g, ' '),
              body: node.body || '',
              isAxiom: node.isAxiom,
              category: extractCategory(node),
              premises: premiseIds,
            }
          })

          const nodeIdSet = new Set(serializedNodes.map(n => n.id))
          const edges: { source: string; target: string }[] = []
          const seen = new Set<string>()

          for (const node of serializedNodes) {
            for (const premiseId of node.premises) {
              if (nodeIdSet.has(premiseId)) {
                const key = `${premiseId}->${node.id}`
                if (!seen.has(key)) {
                  seen.add(key)
                  edges.push({ source: premiseId, target: node.id })
                }
              }
            }
          }

          const result: SerializedGraph = { nodes: serializedNodes, edges, label }

          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(result))
        } catch (err: any) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: err.message }))
        }
      })
    },
  }
}
