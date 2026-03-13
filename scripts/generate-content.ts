import { mkdirSync, rmSync, writeFileSync } from 'fs'
import { join } from 'path'

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
const rand = mulberry32(42)

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)]
}

// --- Categories ---
const CATEGORIES = [
  'mathematics', 'physics', 'logic', 'philosophy',
  'computation', 'biology', 'linguistics', 'systems',
] as const
type Category = typeof CATEGORIES[number]

// --- Hand-written files in content/ ---
interface ManualNode { id: string; name: string; categories: Category[] }

const MANUAL_NODES: ManualNode[] = [
  { id: 'mathematics', name: 'Mathematics', categories: ['mathematics', 'physics', 'computation'] },
  { id: 'logic', name: 'Logic', categories: ['logic', 'mathematics', 'philosophy', 'computation'] },
  { id: 'first-principles', name: 'First Principles', categories: ['philosophy', 'logic', 'mathematics'] },
  { id: 'cogito', name: 'Cogito', categories: ['philosophy'] },
  { id: 'epistemology', name: 'Epistemology', categories: ['philosophy', 'logic'] },
  { id: 'empiricism', name: 'Empiricism', categories: ['philosophy', 'biology', 'physics'] },
  { id: 'rationalism', name: 'Rationalism', categories: ['philosophy', 'logic', 'mathematics'] },
  { id: 'law-of-non-contradiction', name: 'Law of Non-Contradiction', categories: ['logic', 'philosophy'] },
  { id: 'scientific-method', name: 'Scientific Method', categories: ['physics', 'biology', 'systems'] },
  { id: 'scientific-theories', name: 'Scientific Theories', categories: ['physics', 'biology'] },
  { id: 'falsifiability', name: 'Falsifiability', categories: ['philosophy', 'logic'] },
  { id: 'philosophy-of-science', name: 'Philosophy of Science', categories: ['philosophy', 'physics'] },
  { id: 'evolution', name: 'Evolution', categories: ['biology', 'systems'] },
  { id: 'general-relativity', name: 'General Relativity', categories: ['physics', 'mathematics'] },
  { id: 'quantum-mechanics', name: 'Quantum Mechanics', categories: ['physics', 'mathematics', 'computation'] },
  { id: 'information-theory', name: 'Information Theory', categories: ['computation', 'systems', 'mathematics'] },
  { id: 'computation', name: 'Computation', categories: ['computation', 'mathematics', 'logic'] },
  { id: 'artificial-intelligence', name: 'Artificial Intelligence', categories: ['computation', 'biology', 'linguistics'] },
  { id: 'philosophy-of-mind', name: 'Philosophy of Mind', categories: ['philosophy', 'biology'] },
  { id: 'consciousness', name: 'Consciousness', categories: ['philosophy', 'biology'] },
  { id: 'ethics', name: 'Ethics', categories: ['philosophy'] },
  { id: 'free-will', name: 'Free Will', categories: ['philosophy'] },
  { id: 'language', name: 'Language', categories: ['linguistics', 'philosophy', 'computation'] },
]
const manualById = new Map(MANUAL_NODES.map(m => [m.id, m]))

// --- Hub definitions: 1 main hub per category ---
const CATEGORY_HUB: Record<Category, string> = {
  mathematics: 'Set Theory',
  physics: 'Classical Mechanics',
  logic: 'Propositional Logic',
  philosophy: 'Ontology',
  computation: 'Turing Machines',
  biology: 'Cell Biology',
  linguistics: 'Phonology',
  systems: 'Control Theory',
}

// --- All concepts per category (flat list, hub is always first) ---
const CONCEPTS: Record<Category, string[]> = {
  mathematics: [
    'Set Theory', // HUB
    'Number Theory', 'Propositional Calculus', 'Euclidean Geometry',
    'Abstract Algebra', 'Real Analysis', 'Linear Algebra', 'Combinatorics', 'Topology',
    'Group Theory', 'Measure Theory', 'Differential Geometry', 'Graph Theory',
    'Category Theory', 'Algebraic Topology', 'Functional Analysis', 'Probability Theory',
    'Homological Algebra', 'Algebraic Geometry', 'Representation Theory',
    'Ergodic Theory', 'Spectral Theory', 'Analytic Number Theory',
  ],
  physics: [
    'Classical Mechanics', // HUB
    'Thermodynamics', 'Electromagnetism',
    'Statistical Mechanics', 'Optics', 'Wave Theory', 'Fluid Dynamics', 'Special Relativity',
    'Quantum Field Theory', 'Solid State Physics', 'Plasma Physics',
    'Nuclear Physics', 'Astrophysics', 'Condensed Matter Physics', 'Particle Physics',
    'String Theory', 'Quantum Gravity', 'Cosmological Models',
    'Quantum Chromodynamics', 'Topological Quantum Matter',
  ],
  logic: [
    'Propositional Logic', // HUB
    'Predicate Logic', 'Boolean Algebra',
    'Modal Logic', 'Proof Theory', 'Model Theory', 'Recursion Theory',
    'Intuitionistic Logic', 'Temporal Logic', 'Many-Valued Logic',
    'Second-Order Logic', 'Deontic Logic', 'Paraconsistent Logic',
    'Topos Theory', 'Linear Logic', 'Type Theory',
    'Automated Theorem Proving', 'Constructive Mathematics',
  ],
  philosophy: [
    'Ontology', // HUB
    'Phenomenology', 'Formal Ethics',
    'Philosophy of Language', 'Metaphysics', 'Aesthetics', 'Political Philosophy',
    'Modal Realism', 'Virtue Ethics', 'Consequentialism',
    'Existentialism', 'Pragmatism', 'Moral Relativism', 'Social Contract Theory',
    'Meta-Ethics', 'Philosophy of Mathematics', 'Epistemic Justification',
    'Compatibilism', 'Mereology',
  ],
  computation: [
    'Turing Machines', // HUB
    'Lambda Calculus', 'Automata Theory',
    'Complexity Theory', 'Algorithm Design', 'Formal Languages', 'Compiler Theory', 'Computability',
    'Distributed Computing', 'Cryptography', 'Machine Learning',
    'Database Theory', 'Programming Language Theory', 'Parallel Computation',
    'Computational Geometry',
    'Quantum Computing', 'Deep Learning', 'Automated Reasoning',
    'Verified Computation', 'Probabilistic Programming',
  ],
  biology: [
    'Cell Biology', // HUB
    'Genetics', 'Natural Selection', 'Ecology',
    'Molecular Biology', 'Evolutionary Biology', 'Developmental Biology', 'Neuroscience',
    'Genomics', 'Systems Biology', 'Population Genetics',
    'Epigenetics', 'Microbiology', 'Immunology', 'Bioinformatics',
    'Synthetic Biology', 'Computational Neuroscience', 'Evolutionary Game Theory',
    'Metagenomics', 'Network Biology',
  ],
  linguistics: [
    'Phonology', // HUB
    'Syntax Theory', 'Formal Semantics',
    'Morphology', 'Pragmatics', 'Historical Linguistics', 'Sociolinguistics',
    'Computational Linguistics', 'Discourse Analysis', 'Cognitive Linguistics',
    'Typological Linguistics', 'Corpus Linguistics', 'Psycholinguistics',
    'Natural Language Processing', 'Optimality Theory', 'Formal Pragmatics',
    'Language Evolution', 'Neurolinguistics',
  ],
  systems: [
    'Control Theory', // HUB
    'Feedback Systems', 'Information Theory Foundations',
    'Cybernetics', 'Dynamical Systems', 'Network Theory', 'Game Theory',
    'Complex Adaptive Systems', 'Chaos Theory', 'Agent-Based Modeling',
    'Signal Processing', 'Queueing Theory', 'Reliability Engineering',
    'Self-Organizing Systems', 'Swarm Intelligence', 'Resilience Engineering',
    'Sociotechnical Systems', 'Systems of Systems',
  ],
}

function nameToId(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-')
}

// --- Build node records ---
interface NodeRecord {
  name: string
  id: string
  category: Category
  isHub: boolean
  premises: string[]
  wikilinks: string[]
}

const nodes: NodeRecord[] = []
const allIds = new Set<string>()

// Index for lookup
const idToName = new Map<string, string>()
for (const m of MANUAL_NODES) idToName.set(m.id, m.name)

for (const cat of CATEGORIES) {
  const hubName = CATEGORY_HUB[cat]
  const hubId = nameToId(hubName)

  for (const name of CONCEPTS[cat]) {
    const id = nameToId(name)
    allIds.add(id)
    idToName.set(id, name)

    const isHub = name === hubName
    const premises: string[] = []
    const wikilinks: string[] = []

    if (isHub) {
      // Hub: connect to 1 manual node to bridge the islands
      const relevant = MANUAL_NODES.filter(m => m.categories.includes(cat))
      if (relevant.length > 0) {
        premises.push(pick(relevant).id)
      }
    } else {
      // Every non-hub node connects to its category hub
      premises.push(hubId)

      // ~40% chance of one additional same-category premise (not the hub)
      if (rand() < 0.4) {
        const sameCat = CONCEPTS[cat].filter(n => nameToId(n) !== hubId && nameToId(n) !== id)
        if (sameCat.length > 0) {
          premises.push(nameToId(pick(sameCat)))
        }
      }

      // ~12% chance of a cross-category premise (to a hub in another category)
      if (rand() < 0.12) {
        const otherCats = CATEGORIES.filter(c => c !== cat)
        const otherCat = pick([...otherCats])
        premises.push(nameToId(CATEGORY_HUB[otherCat]))
      }

      // ~15% chance of linking to a manual node
      if (rand() < 0.15) {
        const relevant = MANUAL_NODES.filter(m =>
          m.categories.includes(cat) && !premises.includes(m.id)
        )
        if (relevant.length > 0) {
          premises.push(pick(relevant).id)
        }
      }

      // ~20% chance of 1 wikilink (same category, not already linked)
      if (rand() < 0.20) {
        const excluded = new Set([...premises, id])
        const candidates = CONCEPTS[cat]
          .map(nameToId)
          .filter(cid => !excluded.has(cid))
        if (candidates.length > 0) {
          wikilinks.push(pick(candidates))
        }
      }
    }

    nodes.push({ name, id, category: cat, isHub, premises, wikilinks })
  }
}

// --- Connectivity check among generated nodes ---
const adjMap = new Map<string, Set<string>>()
for (const n of nodes) adjMap.set(n.id, new Set())

for (const node of nodes) {
  for (const p of node.premises) {
    if (adjMap.has(p)) {
      adjMap.get(node.id)!.add(p)
      adjMap.get(p)!.add(node.id)
    }
  }
  for (const w of node.wikilinks) {
    if (adjMap.has(w)) {
      adjMap.get(node.id)!.add(w)
      adjMap.get(w)!.add(node.id)
    }
  }
}

// BFS to find components
const visited = new Set<string>()
const components: string[][] = []
for (const n of nodes) {
  if (visited.has(n.id)) continue
  const component: string[] = []
  const queue = [n.id]
  visited.add(n.id)
  while (queue.length > 0) {
    const cur = queue.shift()!
    component.push(cur)
    for (const nb of adjMap.get(cur)!) {
      if (!visited.has(nb)) {
        visited.add(nb)
        queue.push(nb)
      }
    }
  }
  components.push(component)
}

// Bridge disconnected components via hub-to-hub wikilinks
if (components.length > 1) {
  console.log(`Found ${components.length} components, bridging...`)
  components.sort((a, b) => b.length - a.length)
  const mainSet = new Set(components[0])

  for (let i = 1; i < components.length; i++) {
    // Find hub in this component
    const compHub = nodes.find(n => components[i].includes(n.id) && n.isHub)
    // Find hub in main component
    const mainHub = nodes.find(n => mainSet.has(n.id) && n.isHub)

    if (compHub && mainHub) {
      compHub.wikilinks.push(mainHub.id)
    } else {
      // Fallback: link any node
      const from = nodes.find(n => n.id === components[i][0])!
      const to = [...mainSet][0]
      from.wikilinks.push(to)
    }
    for (const id of components[i]) mainSet.add(id)
  }
}

// Ensure every manual node is referenced by at least one generated node
const manualIdsReferenced = new Set<string>()
for (const n of nodes) {
  for (const p of n.premises) if (manualById.has(p)) manualIdsReferenced.add(p)
  for (const w of n.wikilinks) if (manualById.has(w)) manualIdsReferenced.add(w)
}
for (const manual of MANUAL_NODES) {
  if (!manualIdsReferenced.has(manual.id)) {
    // Pick a random node in a relevant category and add a wikilink
    const candidates = nodes.filter(n =>
      manual.categories.includes(n.category) &&
      !n.premises.includes(manual.id) &&
      !n.wikilinks.includes(manual.id)
    )
    if (candidates.length > 0) {
      pick(candidates).wikilinks.push(manual.id)
    }
  }
}

// --- Description templates ---
const DESCRIPTIONS: Record<Category, string[]> = {
  mathematics: [
    'A foundational area of mathematical inquiry exploring abstract structures and their relationships.',
    'This branch of mathematics investigates the formal properties and invariants of structured objects.',
    'Central to modern mathematics, this field provides powerful tools for reasoning about quantity, structure, and change.',
    'The study of these mathematical structures reveals deep connections across seemingly disparate domains.',
  ],
  physics: [
    'A fundamental framework for understanding the physical world and its governing laws.',
    'This area of physics describes the behavior of matter and energy at various scales.',
    'Building on empirical observation, this theory provides predictive models for physical phenomena.',
    'The mathematical formulation of these physical principles enables precise quantitative predictions.',
  ],
  logic: [
    'A formal system for reasoning about truth, validity, and logical consequence.',
    'This logical framework extends classical reasoning with additional expressive power.',
    'The study of formal proof and inference in structured deductive systems.',
    'A rigorous approach to understanding the foundations of mathematical and philosophical reasoning.',
  ],
  philosophy: [
    'A systematic investigation into fundamental questions about reality, knowledge, and value.',
    'This philosophical tradition addresses core questions through careful conceptual analysis.',
    'An examination of the deepest assumptions underlying human thought and experience.',
    'This area of philosophical inquiry connects metaphysical questions to practical concerns.',
  ],
  computation: [
    'A theoretical framework for understanding the nature and limits of mechanical computation.',
    'This branch of computer science studies algorithms, complexity, and computational models.',
    'The formal study of computational processes and their mathematical properties.',
    'A foundational area exploring what can be computed and how efficiently.',
  ],
  biology: [
    'A scientific framework for understanding living systems and their underlying mechanisms.',
    'This biological discipline investigates the molecular and cellular basis of life.',
    'The study of biological processes through systematic observation and experimentation.',
    'An integrative approach to understanding the complexity of living organisms.',
  ],
  linguistics: [
    'A formal approach to understanding the structure and meaning of natural language.',
    'This area of linguistics investigates the systematic patterns underlying human communication.',
    'The scientific study of language structure, use, and cognitive underpinnings.',
    'A rigorous framework for analyzing the formal properties of linguistic systems.',
  ],
  systems: [
    'A cross-disciplinary framework for understanding complex interconnected processes.',
    'This field studies the behavior of systems through feedback, control, and information flow.',
    'The analysis of dynamic systems and their emergent properties.',
    'A formal approach to understanding how components interact to produce collective behavior.',
  ],
}

function displayName(id: string): string {
  return idToName.get(id) || id.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')
}

// --- Generate files ---
const OUT_DIR = join(import.meta.dirname!, '..', 'content', 'generated')

console.log(`Generating ${nodes.length} files...`)

rmSync(OUT_DIR, { recursive: true, force: true })
mkdirSync(OUT_DIR, { recursive: true })

let totalPremises = 0
let totalWikilinks = 0

for (const node of nodes) {
  let fm = '---\n'
  fm += `category: ${node.category}\n`
  if (node.premises.length > 0) {
    fm += 'premises:\n'
    for (const p of node.premises) fm += `  - ${p}\n`
  } else {
    fm += 'premises: []\n'
  }
  fm += '---\n'

  const desc = pick(DESCRIPTIONS[node.category])
  const premiseNames = node.premises.map(p => `[[${displayName(p)}]]`)
  const wlNames = node.wikilinks.map(w => `[[${displayName(w)}]]`)

  let body = `# ${node.name}\n\n${desc}\n`
  if (premiseNames.length > 0) body += `\nBuilds upon ${premiseNames.join(' and ')}.`
  if (wlNames.length > 0) body += ` Related to ${wlNames.join(', ')}.`
  body += '\n'

  totalPremises += node.premises.length
  totalWikilinks += node.wikilinks.length
  writeFileSync(join(OUT_DIR, `${node.id}.md`), fm + '\n' + body)
}

// --- Stats ---
console.log(`Done! ${nodes.length} files written to ${OUT_DIR}`)
console.log(`  Premise edges: ${totalPremises}`)
console.log(`  Wikilink edges: ${totalWikilinks}`)
console.log(`  Total edges: ${totalPremises + totalWikilinks}`)
console.log(`  Avg edges/node: ${((totalPremises + totalWikilinks) / nodes.length).toFixed(1)}`)

// Degree distribution
const degreeCount = new Map<number, number>()
for (const n of nodes) {
  const deg = n.premises.length + n.wikilinks.length
  degreeCount.set(deg, (degreeCount.get(deg) || 0) + 1)
}
console.log(`  Degree distribution:`)
for (const [deg, count] of [...degreeCount.entries()].sort((a, b) => a[0] - b[0])) {
  console.log(`    degree ${deg}: ${count} nodes`)
}

// Hub sizes (how many nodes reference each hub)
const inbound = new Map<string, number>()
for (const n of nodes) {
  for (const p of n.premises) inbound.set(p, (inbound.get(p) || 0) + 1)
  for (const w of n.wikilinks) inbound.set(w, (inbound.get(w) || 0) + 1)
}
const topInbound = [...inbound.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)
console.log(`  Top referenced nodes:`)
for (const [id, count] of topInbound) {
  console.log(`    ${id}: ${count} inbound`)
}
