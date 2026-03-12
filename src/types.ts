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

export interface ParsedFile {
  id: string
  name: string
  body: string
  premises: string[]
  wikilinks: string[]
}
