import { useCallback, useRef, useMemo } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import type { GraphData, GraphNode } from '../types'

interface Props {
  data: GraphData
  selectedNodeId: string | null
  searchQuery: string
  onNodeClick: (node: GraphNode) => void
  width: number
  height: number
}

const AXIOMATIC_COLOR = '#f59e0b'
const DERIVED_COLOR = '#6366f1'
const HIGHLIGHT_COLOR = '#f472b6'
const DIMMED_ALPHA = 0.15
const LINK_COLOR = 'rgba(255,255,255,0.15)'
const LINK_HIGHLIGHT_COLOR = 'rgba(255,255,255,0.6)'

export default function GraphView({
  data,
  selectedNodeId,
  searchQuery,
  onNodeClick,
  width,
  height,
}: Props) {
  const fgRef = useRef<any>(null)

  const connectedNodes = useMemo(() => {
    if (!selectedNodeId) return new Set<string>()
    const set = new Set<string>()
    set.add(selectedNodeId)
    for (const link of data.links) {
      const s = typeof link.source === 'object' ? (link.source as any).id : link.source
      const t = typeof link.target === 'object' ? (link.target as any).id : link.target
      if (s === selectedNodeId) set.add(t)
      if (t === selectedNodeId) set.add(s)
    }
    return set
  }, [selectedNodeId, data.links])

  const matchesSearch = useCallback(
    (node: GraphNode) => {
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      return (
        node.name.toLowerCase().includes(q) ||
        node.id.toLowerCase().includes(q)
      )
    },
    [searchQuery]
  )

  const nodeCanvasObject = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const gNode = node as GraphNode & { x: number; y: number }
      const label = gNode.name
      const fontSize = Math.max(12 / globalScale, 1.5)
      const r = Math.sqrt(gNode.val) * 3

      const isSelected = gNode.id === selectedNodeId
      const isConnected = connectedNodes.has(gNode.id)
      const isSearchMatch = matchesSearch(gNode)

      let alpha = 1
      if (selectedNodeId && !isConnected) alpha = DIMMED_ALPHA
      if (searchQuery && !isSearchMatch) alpha = DIMMED_ALPHA

      ctx.globalAlpha = alpha

      // Glow for selected/search match
      if (isSelected || (searchQuery && isSearchMatch)) {
        ctx.beginPath()
        ctx.arc(gNode.x, gNode.y, r + 3, 0, 2 * Math.PI)
        ctx.fillStyle = HIGHLIGHT_COLOR + '60'
        ctx.fill()
      }

      // Node circle
      ctx.beginPath()
      ctx.arc(gNode.x, gNode.y, r, 0, 2 * Math.PI)
      ctx.fillStyle = gNode.isAxiomatic ? AXIOMATIC_COLOR : DERIVED_COLOR
      ctx.fill()

      // Label
      ctx.font = `${fontSize}px Inter, system-ui, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillStyle = `rgba(255,255,255,${alpha})`
      ctx.fillText(label, gNode.x, gNode.y + r + 2)

      ctx.globalAlpha = 1
    },
    [selectedNodeId, connectedNodes, searchQuery, matchesSearch]
  )

  const linkColor = useCallback(
    (link: any) => {
      if (!selectedNodeId) return LINK_COLOR
      const s = typeof link.source === 'object' ? link.source.id : link.source
      const t = typeof link.target === 'object' ? link.target.id : link.target
      if (s === selectedNodeId || t === selectedNodeId) return LINK_HIGHLIGHT_COLOR
      return LINK_COLOR
    },
    [selectedNodeId]
  )

  return (
    <ForceGraph2D
      ref={fgRef}
      graphData={data}
      width={width}
      height={height}
      backgroundColor="#0a0a0f"
      nodeCanvasObject={nodeCanvasObject}
      nodePointerAreaPaint={(node: any, color, ctx) => {
        const r = Math.sqrt((node as GraphNode).val) * 3 + 4
        ctx.beginPath()
        ctx.arc(node.x, node.y, r, 0, 2 * Math.PI)
        ctx.fillStyle = color
        ctx.fill()
      }}
      linkColor={linkColor}
      linkWidth={1}
      onNodeClick={(node) => onNodeClick(node as GraphNode)}
      d3AlphaDecay={0.02}
      d3VelocityDecay={0.3}
    />
  )
}
