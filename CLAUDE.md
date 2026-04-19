# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server (auto-cleans .next and re-parses markdown)
npm run build      # Production build (also auto-parses markdown)
npm run lint       # Run ESLint
npm run parse      # Manually regenerate src/data/onyx-db.json from data/raw_notes/
```

No test runner is configured. Quality checks before submitting: `npm run lint && npm run build`.

## Architecture

Onyx is a Next.js 15 (App Router) + React 19 + TypeScript application. It has **no backend** — all data is a static JSON file bundled at build time.

### Content pipeline

`data/raw_notes/*.md` → `scripts/parse-markdown.ts` → `src/data/onyx-db.json` → frontend

The parser runs automatically via `predev`/`prebuild` hooks. Markdown structure maps directly to the database schema:

- `##` heading → `OnyxCategory`
- `###` heading → `OnyxSection`
- fenced code block → `OnyxCommand` (prose text between a heading and a block becomes `description`)

The generated `src/data/onyx-db.json` is committed to version control.

### Live placeholder hydration

`src/lib/commandHydrator.ts` exports `hydrateCommand(rawCommand, targetState)`. It applies a prioritized list of regex rules (`PLACEHOLDER_RULES`) to replace tokens like `$IP`, `<domain>`, `DC01`, `10.10.10.10`, etc. with values from the Zustand store. **Order in `PLACEHOLDER_RULES` matters** — more specific patterns (e.g. DC FQDN) must precede generic ones (e.g. bare domain) to prevent partial replacements.

### State management

`src/store/useTargetStore.ts` — Zustand store with `persist` middleware (key: `onyx-target-store` in localStorage). Holds seven `TargetVariables` fields: `targetIP`, `targetDomain`, `targetDC`, `targetUser`, `targetPassword`, `localIP`, `localPort`. Default values are intentionally set to common placeholder strings so they round-trip through `hydrateCommand` visibly on first load.

### UI structure

Three-panel layout: **Sidebar** (document/category nav) | **main content** (commands) | **ConfigPanel** (target variable inputs). On mobile the right panel collapses into a modal. Anchor IDs for scroll-to-section are generated deterministically from category + section titles.

Search is powered by Fuse.js via `src/hooks/useSmartSearch.ts` and operates over a pre-built index of the JSON database.

### Key type contracts

All shared types live in `src/types/index.ts`. The database schema is separately declared in `src/types/onyx.d.ts` for parity with the build script (which cannot import from `src/`).

## Conventions

- Path alias `@/` maps to `src/`.
- Components are PascalCase files, one per file. Hooks use the `use*` prefix. Store actions use the `set*` prefix.
- When adding new placeholder patterns to `PLACEHOLDER_RULES`, insert them in specificity order and ensure the regex uses the `g` flag (and `i` where case-insensitive matching is appropriate).
- To add new content, drop a `.md` file into `data/raw_notes/` and run `npm run parse`. No code changes required unless a new placeholder pattern is needed.
