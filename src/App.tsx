import { useState, useMemo, useCallback, useEffect } from 'react'
import GraphView from './components/GraphView'
import NodePanel from './components/NodePanel'
import SettingsPanel from './components/SettingsPanel'
import { parseAllFiles } from './lib/parser'
import { buildGraph } from './lib/graph'
import type { GraphNode } from './types'
import { DEFAULT_SETTINGS, type ViewSettings, CATEGORIES, CATEGORY_COLORS } from './types'

const mdFiles = import.meta.glob('/content/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

function useWindowSize() {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight })
  useEffect(() => {
    const onResize = () => setSize({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return size
}

export default function App() {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewSettings, setViewSettings] = useState<ViewSettings>(DEFAULT_SETTINGS)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const { width, height } = useWindowSize()

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light')
  }, [theme])

  const graphData = useMemo(() => {
    const parsed = parseAllFiles(mdFiles)
    return buildGraph(parsed)
  }, [])

  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode((prev) => (prev?.id === node.id ? null : node))
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedNode(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const panelWidth = selectedNode ? 320 : 0
  const graphWidth = width - panelWidth

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden">
      <div className="flex-1 relative">
        {/* Search bar */}
        <div className="absolute top-4 left-4 z-10">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search nodes…"
              className="bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-faint)] outline-none focus:border-[var(--text-muted)] w-64 pr-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-1 top-1/2 -translate-y-1/2 text-[var(--text-faint)] hover:text-[var(--text-secondary)] text-sm cursor-pointer p-2"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-10 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text-muted)] max-w-md">
          {CATEGORIES.map((cat) => (
            <span key={cat} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: CATEGORY_COLORS[cat] }}
              />
              {cat}
            </span>
          ))}
        </div>

        {/* Node count, theme toggle & settings */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          <span className="text-xs text-[var(--text-faint)]">
            {graphData.nodes.length} nodes · {graphData.links.length} edges
          </span>
          <button
            onClick={() => setTheme((t) => t === 'dark' ? 'light' : 'dark')}
            className="p-1.5 rounded-md bg-[var(--bg-input)] border border-[var(--border)] hover:bg-[var(--border)] transition-colors cursor-pointer"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-[var(--text-muted)]">
              {theme === 'dark' ? (
                <path fillRule="evenodd" d="M7.455 2.004a.75.75 0 0 1 .26.77 7 7 0 0 0 9.958 7.967.75.75 0 0 1 1.067.853A8.5 8.5 0 1 1 6.647 1.921a.75.75 0 0 1 .808.083Z" clipRule="evenodd" />
              ) : (
                <path d="M10 2a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 2ZM10 15a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 15ZM10 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM15.657 5.404a.75.75 0 1 0-1.06-1.06l-1.061 1.06a.75.75 0 0 0 1.06 1.06l1.06-1.06ZM6.464 14.596a.75.75 0 1 0-1.06-1.06l-1.06 1.06a.75.75 0 0 0 1.06 1.06l1.06-1.06ZM18 10a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 18 10ZM5 10a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 5 10ZM14.596 15.657a.75.75 0 0 0 1.06-1.06l-1.06-1.061a.75.75 0 1 0-1.06 1.06l1.06 1.06ZM5.404 6.464a.75.75 0 0 0 1.06-1.06l-1.06-1.06a.75.75 0 1 0-1.06 1.06l1.06 1.06Z" />
              )}
            </svg>
          </button>
        </div>
        <SettingsPanel settings={viewSettings} onChange={setViewSettings} />

        <GraphView
          data={graphData}
          selectedNodeId={selectedNode?.id ?? null}
          searchQuery={searchQuery}
          onNodeClick={handleNodeClick}
          onBackgroundClick={() => setSelectedNode(null)}
          width={graphWidth}
          height={height}
          settings={viewSettings}
          theme={theme}
        />
      </div>

      <NodePanel
        node={selectedNode}
        graphData={graphData}
        onClose={() => setSelectedNode(null)}
        onSelectNode={(id) => {
          const target = graphData.nodes.find((n) => n.id === id)
          if (target) setSelectedNode(target as GraphNode)
        }}
      />
    </div>
  )
}
