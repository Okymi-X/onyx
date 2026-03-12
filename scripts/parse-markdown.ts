/**
 * parse-markdown.ts
 * 
 * Build-time script that reads Markdown files from the Obsidian vault,
 * parses their structure (categories, sections, code blocks), and outputs
 * a single JSON database consumed by the Onyx frontend.
 *
 * Execution: ts-node scripts/parse-markdown.ts
 * Also runs automatically via the "predev" and "prebuild" npm scripts.
 */

import * as fs from 'fs';
import * as path from 'path';

/* ------------------------------------------------------------------ */
/*  Types (mirrored from src/types/onyx.d.ts for script isolation)    */
/* ------------------------------------------------------------------ */

interface OnyxCommand {
  code: string;
  language: string;
  description?: string;
}

interface OnyxSection {
  title: string;
  commands: OnyxCommand[];
}

interface OnyxCategory {
  title: string;
  sections: OnyxSection[];
}

interface OnyxDocument {
  fileName: string;
  categories: OnyxCategory[];
}

interface OnyxDatabase {
  generatedAt: string;
  documentCount: number;
  commandCount: number;
  documents: OnyxDocument[];
}

/* ------------------------------------------------------------------ */
/*  Configuration                                                     */
/* ------------------------------------------------------------------ */

/** Source directory containing the curated Markdown cheat sheets */
const SOURCE_DIR = path.resolve(
  process.env.ONYX_MD_SOURCE || path.join(__dirname, '..', 'data', 'raw_notes')
);

/** Output path for the generated JSON database */
const OUTPUT_PATH = path.resolve(__dirname, '..', 'src', 'data', 'onyx-db.json');

/* ------------------------------------------------------------------ */
/*  Parser                                                            */
/* ------------------------------------------------------------------ */

/**
 * Parses a single Markdown file into an OnyxDocument.
 * Walks each line once, tracking the current category/section context
 * and extracting code fence blocks with their language tags.
 */
function parseMarkdownFile(filePath: string): OnyxDocument {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const fileName = path.basename(filePath, '.md');

  const categories: OnyxCategory[] = [];
  let currentCategory: OnyxCategory | null = null;
  let currentSection: OnyxSection | null = null;

  /** Accumulates description text between a heading and the next code block */
  let descriptionBuffer: string[] = [];

  /** Tracks whether we are inside a code fence */
  let inCodeBlock = false;
  let codeLanguage = '';
  let codeLines: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.replace(/\r$/, '');

    /* -- Code fence open -- */
    if (!inCodeBlock && line.startsWith('```') && line.trimEnd() !== '```') {
      inCodeBlock = true;
      codeLanguage = line.slice(3).trim() || 'text';
      codeLines = [];
      continue;
    }

    /* -- Code fence close -- */
    if (inCodeBlock && line.trimEnd() === '```') {
      inCodeBlock = false;
      const command: OnyxCommand = {
        code: codeLines.join('\n'),
        language: codeLanguage,
      };

      const desc = descriptionBuffer.join(' ').trim();
      if (desc.length > 0) {
        command.description = desc;
      }
      descriptionBuffer = [];

      /* Attach command to the deepest available context */
      if (currentSection) {
        currentSection.commands.push(command);
      } else if (currentCategory) {
        /* Section-less code block: create an implicit "General" section */
        const implicitSection: OnyxSection = { title: 'General', commands: [command] };
        currentCategory.sections.push(implicitSection);
      }
      continue;
    }

    /* -- Inside code fence: accumulate code -- */
    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    /* -- ## Category heading -- */
    if (line.startsWith('## ') && !line.startsWith('### ')) {
      descriptionBuffer = [];
      currentCategory = {
        title: line.slice(3).trim(),
        sections: [],
      };
      categories.push(currentCategory);
      currentSection = null;
      continue;
    }

    /* -- ### Section heading -- */
    if (line.startsWith('### ')) {
      descriptionBuffer = [];
      currentSection = {
        title: line.slice(4).trim(),
        commands: [],
      };
      if (currentCategory) {
        currentCategory.sections.push(currentSection);
      }
      continue;
    }

    /* -- Delimiter lines (*** or ---) are skipped -- */
    if (/^\*{3,}$|^-{3,}$/.test(line.trim())) {
      continue;
    }

    /* -- Regular text: feed description buffer -- */
    const trimmed = line.trim();
    if (trimmed.length > 0 && !inCodeBlock) {
      descriptionBuffer.push(trimmed);
    }
  }

  return { fileName, categories };
}

/* ------------------------------------------------------------------ */
/*  Main                                                              */
/* ------------------------------------------------------------------ */

function main(): void {
  console.log(`[onyx] Reading Markdown files from: ${SOURCE_DIR}`);

  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`[onyx] Source directory not found: ${SOURCE_DIR}`);
    process.exit(1);
  }

  const mdFiles = fs.readdirSync(SOURCE_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => path.join(SOURCE_DIR, f));

  console.log(`[onyx] Found ${mdFiles.length} Markdown files`);

  const documents: OnyxDocument[] = mdFiles.map((filePath) => {
    const doc = parseMarkdownFile(filePath);
    console.log(`  -> ${doc.fileName}: ${doc.categories.length} categories`);
    return doc;
  });

  const commandCount = documents.reduce(
    (total, doc) =>
      total +
      doc.categories.reduce(
        (catTotal, cat) =>
          catTotal + cat.sections.reduce((secTotal, sec) => secTotal + sec.commands.length, 0),
        0,
      ),
    0,
  );

  const database: OnyxDatabase = {
    generatedAt: new Date().toISOString(),
    documentCount: documents.length,
    commandCount,
    documents,
  };

  /* Ensure the output directory exists */
  const outputDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(database, null, 2), 'utf-8');
  console.log(`[onyx] Database written to: ${OUTPUT_PATH}`);
  console.log(`[onyx] ${documents.length} documents, ${commandCount} commands total`);
}

main();
