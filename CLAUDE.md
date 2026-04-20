# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (auto-cleans .next, re-parses markdown + posts)
npm run build        # Production build (also auto-parses)
npm run lint         # Run ESLint
npm run parse        # Regenerate src/data/onyx-db.json from data/raw_notes/
npm run parse:posts  # Regenerate src/data/posts-db.json from data/posts/
```

No test runner is configured. Quality checks before submitting: `npm run lint && npm run build`.

## Architecture

Onyx is a Next.js 15 (App Router) + React 19 + TypeScript application. It has **no backend** — all data is static JSON bundled at build time.

### Routes

| Route | Description |
|---|---|
| `/` | Homepage — hero, stats, recent posts, cheat sheet teaser |
| `/cheatsheets` | Three-panel command reference tool (existing Onyx tool) |
| `/blog` | Blog listing with type filter (articles / write-ups / notes) |
| `/blog/[slug]` | Post detail — markdown renderer, sticky TOC, related posts |

### Content pipeline — Cheat Sheets

`data/raw_notes/*.md` → `scripts/parse-markdown.ts` → `src/data/onyx-db.json` → frontend

Markdown structure: `##` heading → `OnyxCategory`, `###` heading → `OnyxSection`, fenced code block → `OnyxCommand`.

### Content pipeline — Blog Posts

`data/posts/{articles,writeups,notes}/*.md` → `scripts/parse-posts.ts` → `src/data/posts-db.json` → frontend

**Frontmatter schema:**
```yaml
---
title: "Post title"
date: "2025-10-14"          # ISO date
type: article               # article | writeup | note
tags: [tag1, tag2]
summary: "Short description shown in cards"
difficulty: easy            # write-ups only: easy | medium | hard | insane
platform: HackTheBox        # write-ups only
coverImage: /images/foo.png # optional
published: true             # set false to exclude from build
---
```

Both generated JSON files are committed to version control.

### Live placeholder hydration (cheat sheets only)

`src/lib/commandHydrator.ts` exports `hydrateCommand(rawCommand, targetState)`. It applies a prioritized list of regex rules (`PLACEHOLDER_RULES`) to replace tokens like `$IP`, `<domain>`, `DC01`, `10.10.10.10`, etc. with values from the Zustand store. **Order in `PLACEHOLDER_RULES` matters** — more specific patterns (e.g. DC FQDN) must precede generic ones (e.g. bare domain).

### State management

`src/store/useTargetStore.ts` — Zustand store with `persist` middleware (key: `onyx-target-store` in localStorage). Holds seven `TargetVariables` fields: `targetIP`, `targetDomain`, `targetDC`, `targetUser`, `targetPassword`, `localIP`, `localPort`.

### Blog markdown rendering

`src/components/blog/PostDetail.tsx` renders post bodies with `react-markdown` + `remark-gfm`. Key features:
- Code blocks with language badge, syntax coloring, and copy button
- Images: `next/image` for local paths (`/…`), plain `<img>` for external URLs with lazy loading; alt text becomes a caption
- Tables, blockquotes, inline code, ordered/unordered lists
- Heading IDs via `slugifyHeading()` from `src/lib/postUtils.ts` — used both for TOC generation and anchor links
- Sticky TOC with `IntersectionObserver` scroll-spy (desktop only)

### Content type color mapping

| Type | Color |
|---|---|
| `article` | `#4EC9B0` (teal) |
| `writeup` | `#7D7AF7` (violet) |
| `note` | `#D7BA7D` (gold) |
| `cheatsheet` | `#569CD6` (blue) |

Defined in `src/lib/postUtils.ts` → `POST_TYPE_THEMES`.

### UI structure

**Cheat sheets** (`/cheatsheets`): three-panel layout — **Sidebar** | **content** | **ConfigPanel**. On mobile the side panels collapse into modals.

**Blog pages** (`/`, `/blog`, `/blog/[slug]`): single-column with shared `TopNav` (fixed, `h-14`). Blog post detail has a two-column layout with optional sticky TOC sidebar on desktop.

**TopNav** (`src/components/layout/TopNav.tsx`): fixed top bar, `z-40`. Contains logo, nav links with type-specific active colors, and `GlobalSearchBar`.

**GlobalSearchBar** (`src/components/search/GlobalSearchBar.tsx`): `Ctrl+K` overlay, searches both cheat sheet commands and blog posts in parallel, navigates to `/cheatsheets#{anchorId}` or `/blog/{slug}`.

Search is powered by Fuse.js via `src/hooks/useSmartSearch.ts` (commands) and `src/hooks/useBlogSearch.ts` (posts).

### Key type contracts

- `src/types/index.ts` — `TargetVariables`, `TargetStore`, `Category`, `Section`, `SearchResult`; re-exports blog types
- `src/types/blog.ts` — `BlogPost`, `PostType`, `PostsDatabase`, `TocEntry`, `PostTypeTheme`
- `src/types/onyx.d.ts` — `OnyxDocument`, `OnyxCategory`, `OnyxSection`, `OnyxCommand`, `OnyxDatabase`

## Conventions

- Path alias `@/` maps to `src/`.
- Components are PascalCase files, one per file. Hooks use the `use*` prefix. Store actions use the `set*` prefix.
- When adding new placeholder patterns to `PLACEHOLDER_RULES`, insert them in specificity order with the `g` flag (and `i` where case-insensitive matching is appropriate).
- To add cheat sheet content: drop a `.md` file into `data/raw_notes/` and run `npm run parse`.
- To add a blog post: create a `.md` file with frontmatter in `data/posts/{articles,writeups,notes}/` and run `npm run parse:posts`.
- The `slugifyHeading()` function in `postUtils.ts` must stay in sync with the heading ID overrides in `PostDetail.tsx` — both must produce identical IDs for TOC scroll-spy to work.
