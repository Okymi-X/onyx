# Onyx

Onyx is an open source red team and pentest command reference built for fast lookup, structured navigation, and live variable injection.

Repository: https://github.com/Okymi-X/onyx

If the project helps you, leave a star on GitHub. It improves visibility and helps attract contributors.

## What Onyx Does

- Aggregates offensive security notes into a structured command database.
- Parses Markdown source files into a searchable JSON dataset.
- Replaces placeholders like target IPs, domains, usernames, passwords, and local callback values in real time.
- Provides a focused UI for browsing documents, categories, sections, and commands.

## Core Features

- Full-text and fuzzy search across commands and sections.
- Live hydration of placeholders from the Target Config panel.
- Three-panel workflow: navigation, content, and variable configuration.
- Markdown-driven content pipeline for maintaining the knowledge base.
- Open source workflow for community contributions.

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS 4
- Zustand
- Fuse.js

## Project Structure

```text
src/
	app/                  App Router entrypoints, metadata, global styles
	components/           Layout, command rendering, search UI
	data/                 Generated Onyx database JSON
	hooks/                Search and UI hooks
	lib/                  Command hydration and shared utilities
	store/                Zustand state for target variables
	types/                Shared TypeScript types
data/raw_notes/         Source Markdown cheat sheets
scripts/                Content parsing and build-time generation
```

## Local Development

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

The development flow automatically:

- Cleans stale `.next` output before dev.
- Parses Markdown notes before dev and build.
- Regenerates the JSON command database from `data/raw_notes/`.

## Available Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run parse
```

## Content Workflow

Markdown files inside `data/raw_notes/` are the source of truth.

To update the knowledge base:

1. Edit or add Markdown notes in `data/raw_notes/`.
2. Run `npm run parse` to regenerate the structured database.
3. Run `npm run dev` or `npm run build` to validate the output.

## Contributing

Contributions are welcome.

You can help by:

- Fixing inaccurate commands.
- Improving placeholder consistency.
- Adding new cheat sheets or sections.
- Improving search, UI, or parsing.
- Reporting issues and edge cases.

Recommended contribution flow:

1. Fork the repository.
2. Create a feature branch.
3. Make focused changes.
4. Run lint and build checks.
5. Open a pull request.

## Quality Checks

Before submitting changes, run:

```bash
npm run lint
npm run build
```

## License and Credits

See the repository for license details and contribution history:

https://github.com/Okymi-X/onyx
