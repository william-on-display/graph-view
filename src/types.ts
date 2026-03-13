export interface GraphNode {
  id: string
  name: string
  val: number
  isAxiomatic: boolean
  category: string
  body: string
  premises: string[]
  wikilinks: string[]
}

export const CATEGORIES = [
  'mathematics',
  'physics',
  'logic',
  'philosophy',
  'computation',
  'biology',
  'linguistics',
  'systems',
] as const

export const CATEGORY_COLORS: Record<string, string> = {
  mathematics: '#3b82f6',
  physics: '#8b5cf6',
  logic: '#f59e0b',
  philosophy: '#f43f5e',
  computation: '#06b6d4',
  biology: '#10b981',
  linguistics: '#f97316',
  systems: '#ec4899',
}

export interface GraphLink {
  source: string
  target: string
}

export interface GraphData {
  nodes: GraphNode[]
  links: GraphLink[]
}

export interface ViewSettings {
  showLabels: boolean
  autoHideLabels: boolean
  labelScale: number
  nodeScale: number
  linkWidth: number
  showArrows: boolean
  linkCurvature: number
  showParticles: boolean
  repelForce: number
  linkDistance: number
  linkCullThreshold: number
  groupByCategory: boolean
  categoryGroupStrength: number
  minZoom: number
  maxZoom: number
  panDuration: number
  zoomDuration: number
}

export const DEFAULT_SETTINGS: ViewSettings = {
  showLabels: true,
  autoHideLabels: true,
  labelScale: 1,
  nodeScale: 1,
  linkWidth: 1,
  showArrows: false,
  linkCurvature: 0,
  showParticles: false,
  repelForce: -100,
  linkDistance: 60,
  linkCullThreshold: 0.5,
  groupByCategory: false,
  categoryGroupStrength: 0.3,
  minZoom: 0.1,
  maxZoom: 20,
  panDuration: 1000,
  zoomDuration: 2000,
}

export interface ParsedFile {
  id: string
  name: string
  category: string
  body: string
  premises: string[]
  wikilinks: string[]
}
