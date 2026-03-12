export interface GraphNode {
  id: string
  name: string
  val: number
  isAxiomatic: boolean
  body: string
  premises: string[]
  wikilinks: string[]
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
}

export const DEFAULT_SETTINGS: ViewSettings = {
  showLabels: true,
  autoHideLabels: false,
  labelScale: 1,
  nodeScale: 1,
  linkWidth: 1,
  showArrows: false,
  linkCurvature: 0,
  showParticles: false,
  repelForce: -100,
  linkDistance: 60,
}

export interface ParsedFile {
  id: string
  name: string
  body: string
  premises: string[]
  wikilinks: string[]
}
