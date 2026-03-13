# Graph View

An interactive force-directed graph for exploring interconnected markdown files. Built with React, TypeScript, and [force-graph](https://github.com/vasturiano/force-graph).

## Features

- **Force-directed layout** — nodes repel and links attract, settling into an organic structure
- **Node selection** — click a node to zoom into its network, see connected premises and references
- **Search** — filter nodes by name with real-time highlighting
- **Clickable sidebar** — premises and references link to their nodes in the graph
- **Auto-colored links** — links inherit their source node's category color
- **Smart labels** — fade in as you zoom, always visible for selected networks and search matches
- **Light/dark mode** — toggle between themes
- **Configurable settings** — adjust labels, node size, link style, physics, and camera animation

## Getting started

```bash
npm install
npm run dev
```

## Content

Markdown files live in `content/`. Each file uses YAML frontmatter:

```markdown
---
name: Example Node
category: mathematics
premises:
  - dependency-one
  - dependency-two
---

Body text goes here.
```

- **name** — display label on the graph
- **category** — determines node color (mathematics, physics, logic, philosophy, computation, biology, linguistics, systems)
- **premises** — links to other files (by filename without extension)
- Wikilinks (`[[other-file]]`) in the body also create graph edges

## Tech stack

- [React](https://react.dev) + [TypeScript](https://www.typescriptlang.org)
- [Vite](https://vite.dev)
- [react-force-graph-2d](https://github.com/vasturiano/react-force-graph)
- [Tailwind CSS](https://tailwindcss.com)
