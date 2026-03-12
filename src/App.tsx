import { useState, useMemo, useCallback, useEffect } from 'react'
import GraphView from './components/GraphView'
import NodePanel from './components/NodePanel'
import SettingsPanel from './components/SettingsPanel'
import { parseAllFiles } from './lib/parser'
import { buildGraph } from './lib/graph'
import type { GraphNode } from './types'
import { DEFAULT_SETTINGS, type ViewSettings } from './types'

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
  const { width, height } = useWindowSize()

  const graphData = useMemo(() => {
    const parsed = parseAllFiles(mdFiles)
    return buildGraph(parsed)
  }, [])

  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode((prev) => (prev?.id === node.id ? null : node))
  }, [])

  const panelWidth = selectedNode ? 320 : 0
  const graphWidth = width - panelWidth

  return (
    <div className="flex h-screen bg-[#0a0a0f] text-white overflow-hidden">
      <div className="flex-1 relative">
        {/* Search bar */}
        <div className="absolute top-4 left-4 z-10">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search nodes…"
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-white/30 w-64"
          />
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-10 flex gap-4 text-xs text-white/50">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            Axiomatic
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            Derived
          </span>
        </div>

        {/* Node count & settings */}
        <div className="absolute top-4 right-4 z-10 text-xs text-white/30">
          {graphData.nodes.length} nodes · {graphData.links.length} edges
        </div>
        <SettingsPanel settings={viewSettings} onChange={setViewSettings} />

        <GraphView
          data={graphData}
          selectedNodeId={selectedNode?.id ?? null}
          searchQuery={searchQuery}
          onNodeClick={handleNodeClick}
          width={graphWidth}
          height={height}
          settings={viewSettings}
        />
      </div>

      <NodePanel
        node={selectedNode}
        graphData={graphData}
        onClose={() => setSelectedNode(null)}
      />
    </div>
  )
}
