/**
 * Onyx data model types.
 * Defines the shape of parsed Markdown data that powers the command database.
 * These types are shared between the build-time parser and the runtime frontend.
 */

/** A single executable command block extracted from a Markdown code fence */
export interface OnyxCommand {
  /** The raw command text inside the code fence */
  code: string;
  /** The language identifier from the code fence (bash, powershell, sql, etc.) */
  language: string;
  /** Optional descriptive text found between the heading and the code fence */
  description?: string;
}

/** A subsection (### heading) containing related commands */
export interface OnyxSection {
  /** The section title (from ### heading), preserving original formatting */
  title: string;
  /** All command blocks found under this section */
  commands: OnyxCommand[];
}

/** A top-level category (## heading) grouping multiple sections */
export interface OnyxCategory {
  /** The category title (from ## heading), emojis preserved for display */
  title: string;
  /** Subsections belonging to this category */
  sections: OnyxSection[];
}

/** A fully parsed Markdown document */
export interface OnyxDocument {
  /** Original filename without the .md extension */
  fileName: string;
  /** All categories found in the document */
  categories: OnyxCategory[];
}

/** The complete Onyx database shape written to onyx-db.json */
export interface OnyxDatabase {
  /** ISO timestamp of when the database was generated */
  generatedAt: string;
  /** Total number of source documents parsed */
  documentCount: number;
  /** Total number of command blocks across all documents */
  commandCount: number;
  /** All parsed documents */
  documents: OnyxDocument[];
}
