import { mkdirSync, rmSync, writeFileSync } from 'fs'
import { join } from 'path'

// --- CLI args ---
const args = process.argv.slice(2)
function flag(name: string, fallback: string): string {
  const i = args.indexOf(`--${name}`)
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback
}
const COUNT = parseInt(flag('count', '500'), 10)
const EDGES_PER_NODE = parseInt(flag('edges', '3'), 10)
const OUT_DIR = flag('out', join(import.meta.dirname!, '..', 'content', 'generated'))
const SEED = parseInt(flag('seed', '42'), 10)

// --- Seeded PRNG (mulberry32) ---
function mulberry32(seed: number) {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(SEED)

// --- Categories ---
const CATEGORIES = [
  'mathematics',
  'physics',
  'logic',
  'philosophy',
  'computation',
  'biology',
  'linguistics',
  'systems',
] as const

// --- Word pool for topic names ---
const ADJECTIVES = [
  'Abstract', 'Adaptive', 'Algebraic', 'Analytic', 'Applied', 'Axiomatic',
  'Bayesian', 'Biological', 'Causal', 'Classical', 'Cognitive', 'Comparative',
  'Computational', 'Constructive', 'Continuous', 'Critical', 'Cybernetic',
  'Deductive', 'Deterministic', 'Dialectical', 'Differential', 'Digital',
  'Discrete', 'Distributed', 'Dynamic', 'Ecological', 'Emergent', 'Empirical',
  'Epistemic', 'Ethical', 'Evolutionary', 'Existential', 'Experimental',
  'Formal', 'Functional', 'Generative', 'Geometric', 'Global', 'Harmonic',
  'Heuristic', 'Holistic', 'Hyperbolic', 'Inferential', 'Integral',
  'Intuitive', 'Inverse', 'Iterative', 'Kinetic', 'Lateral', 'Linear',
  'Linguistic', 'Logical', 'Material', 'Mechanical', 'Meta', 'Modal',
  'Molecular', 'Moral', 'Natural', 'Neural', 'Nonlinear', 'Normative',
  'Numeric', 'Ontological', 'Optimal', 'Organic', 'Parallel', 'Parametric',
  'Phenomenal', 'Physical', 'Polynomial', 'Practical', 'Predictive',
  'Probabilistic', 'Procedural', 'Quantum', 'Rational', 'Recursive',
  'Relational', 'Scalar', 'Sequential', 'Signal', 'Social', 'Spectral',
  'Statistical', 'Stochastic', 'Structural', 'Symbolic', 'Synthetic',
  'Temporal', 'Theoretical', 'Thermodynamic', 'Topological', 'Universal',
  'Variational', 'Virtual',
]

const NOUNS = [
  'Algebra', 'Algorithm', 'Analysis', 'Architecture', 'Automata',
  'Calculus', 'Category', 'Causation', 'Chaos', 'Cognition', 'Coherence',
  'Complexity', 'Computation', 'Consciousness', 'Continuity', 'Control',
  'Cryptography', 'Cybernetics', 'Deduction', 'Dynamics', 'Ecology',
  'Emergence', 'Encoding', 'Entropy', 'Epistemology', 'Equilibrium',
  'Ethics', 'Evolution', 'Feedback', 'Fields', 'Flow', 'Fractals',
  'Geometry', 'Graphs', 'Groups', 'Harmony', 'Heuristics', 'Hierarchy',
  'Homology', 'Inference', 'Information', 'Integration', 'Invariance',
  'Language', 'Lattices', 'Learning', 'Logic', 'Manifolds', 'Mappings',
  'Mechanics', 'Memory', 'Metabolism', 'Morphology', 'Networks',
  'Notation', 'Ontology', 'Operators', 'Optimization', 'Ordering',
  'Oscillation', 'Paradox', 'Perception', 'Permutation', 'Phenomena',
  'Probability', 'Processes', 'Proof', 'Propagation', 'Reasoning',
  'Recursion', 'Reduction', 'Relativity', 'Representation', 'Resonance',
  'Rings', 'Semantics', 'Sequences', 'Sets', 'Signals', 'Simulation',
  'Spaces', 'Stability', 'Statistics', 'Structures', 'Symmetry',
  'Syntax', 'Systems', 'Tensors', 'Theory', 'Topology', 'Transforms',
  'Truth', 'Turbulence', 'Types', 'Uncertainty', 'Unification', 'Vectors',
  'Verification', 'Waves',
]

// --- Generate unique names ---
function generateNames(n: number): string[] {
  const names = new Set<string>()
  // Single nouns first
  const shuffledNouns = [...NOUNS].sort(() => rand() - 0.5)
  for (const noun of shuffledNouns) {
    if (names.size >= n) break
    names.add(noun)
  }
  // Then compound names
  while (names.size < n) {
    const adj = ADJECTIVES[Math.floor(rand() * ADJECTIVES.length)]
    const noun = NOUNS[Math.floor(rand() * NOUNS.length)]
    names.add(`${adj} ${noun}`)
  }
  return [...names]
}

function nameToId(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-')
}

// --- Barabási-Albert graph ---
interface Edge { from: number; to: number }

function barabasiAlbert(n: number, m: number): Edge[] {
  const edges: Edge[] = []
  const degree = new Array(n).fill(0)

  // Start with a complete graph of m+1 nodes
  const m0 = Math.min(m + 1, n)
  for (let i = 0; i < m0; i++) {
    for (let j = i + 1; j < m0; j++) {
      edges.push({ from: i, to: j })
      degree[i]++
      degree[j]++
    }
  }

  // Add remaining nodes with preferential attachment
  for (let newNode = m0; newNode < n; newNode++) {
    const targets = new Set<number>()
    let totalDegree = degree.reduce((a, b) => a + b, 0)

    while (targets.size < Math.min(m, newNode)) {
      let r = rand() * totalDegree
      for (let i = 0; i < newNode; i++) {
        r -= degree[i]
        if (r <= 0 && !targets.has(i)) {
          targets.add(i)
          break
        }
      }
    }

    for (const t of targets) {
      edges.push({ from: newNode, to: t })
      degree[newNode]++
      degree[t]++
    }
  }

  return edges
}

// --- Build adjacency list ---
function buildAdjacency(n: number, edges: Edge[]): Map<number, Set<number>> {
  const adj = new Map<number, Set<number>>()
  for (let i = 0; i < n; i++) adj.set(i, new Set())
  for (const { from, to } of edges) {
    adj.get(from)!.add(to)
    adj.get(to)!.add(from)
  }
  return adj
}

// --- Sentence templates ---
const TEMPLATES = [
  (links: string[]) => `This area of study builds upon ${links[0]} and extends into ${links[1] || 'broader domains'}.`,
  (links: string[]) => `Key foundations include ${links[0]}, with applications in ${links[1] || 'various fields'}.`,
  (links: string[]) => `The relationship between ${links[0]} and ${links[1] || 'related concepts'} reveals deep structural connections.`,
  (links: string[]) => `Drawing from ${links[0]}, this framework provides tools for understanding ${links[1] || 'complex phenomena'}.`,
  (links: string[]) => `Investigations in this domain often intersect with ${links[0]} and ${links[1] || 'adjacent theories'}.`,
]

// --- Generate files ---
function generate() {
  console.log(`Generating ${COUNT} files (${EDGES_PER_NODE} edges/node, seed=${SEED})...`)

  const names = generateNames(COUNT)
  const edges = barabasiAlbert(COUNT, EDGES_PER_NODE)
  const adj = buildAdjacency(COUNT, edges)

  // Clean and create output dir
  rmSync(OUT_DIR, { recursive: true, force: true })
  mkdirSync(OUT_DIR, { recursive: true })

  let totalLinks = 0

  for (let i = 0; i < COUNT; i++) {
    const name = names[i]
    const id = nameToId(name)
    const neighbors = [...adj.get(i)!]

    // Split neighbors: some go to premises, rest to wikilinks in body
    const premiseCount = Math.min(Math.ceil(neighbors.length / 2), 5)
    const premiseNeighbors = neighbors.slice(0, premiseCount)
    const bodyNeighbors = neighbors.slice(premiseCount)

    // Assign category round-robin
    const category = CATEGORIES[i % CATEGORIES.length]

    // Frontmatter
    let frontmatter = '---\n'
    frontmatter += `category: ${category}\n`
    if (premiseNeighbors.length > 0) {
      frontmatter += 'premises:\n'
      for (const pi of premiseNeighbors) {
        frontmatter += `  - ${nameToId(names[pi])}\n`
      }
    }
    frontmatter += '---\n'

    // Body with wikilinks
    const wikilinks = bodyNeighbors.map(ni => `[[${names[ni]}]]`)
    const allLinks = [...premiseNeighbors.map(ni => `[[${names[ni]}]]`), ...wikilinks]
    totalLinks += allLinks.length

    const template = TEMPLATES[Math.floor(rand() * TEMPLATES.length)]
    const shuffledLinks = allLinks.sort(() => rand() - 0.5)
    const sentence = template(shuffledLinks)

    const extraLinks = wikilinks.length > 2
      ? `\n\nFurther connections: ${wikilinks.slice(0, 5).join(', ')}.`
      : ''

    const content = `${frontmatter}\n# ${name}\n\n${sentence}${extraLinks}\n`

    writeFileSync(join(OUT_DIR, `${id}.md`), content)
  }

  const avgDegree = (edges.length * 2 / COUNT).toFixed(1)
  console.log(`Done! ${COUNT} files written to ${OUT_DIR}`)
  console.log(`  Edges: ${edges.length} | Avg degree: ${avgDegree} | Total wikilinks: ${totalLinks}`)
}

generate()
