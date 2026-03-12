import { useMemo } from "react";
import Fuse, { type IFuseOptions, type FuseResult } from "fuse.js";
import type { OnyxDatabase } from "@/types/onyx";

/**
 * Flattened search entry -- one record per command block.
 * Contains enough context to display meaningful results and scroll to the target.
 */
export interface SearchEntry {
  /** Document file name */
  docName: string;
  /** ## category title */
  categoryTitle: string;
  /** ### section title */
  sectionTitle: string;
  /** Raw command code (searched, not displayed in full) */
  commandCode: string;
  /** Optional description text */
  commandDescription: string;
  /** Anchor ID matching the one rendered in SectionRenderer */
  anchorId: string;
}

/**
 * Builds a deterministic anchor ID identical to the one in CategoryView.
 * Must stay in sync with `buildAnchorId` in CategoryView.tsx.
 */
function buildAnchorId(
  docName: string,
  catTitle: string,
  secTitle: string,
): string {
  return `${docName}--${catTitle}--${secTitle}`
    .replace(/\s+/g, "-")
    .toLowerCase();
}

/**
 * Flattens the nested OnyxDatabase into a single searchable array.
 * Each command block becomes one SearchEntry with full hierarchy context.
 */
function flattenDatabase(db: OnyxDatabase): SearchEntry[] {
  const entries: SearchEntry[] = [];

  for (const doc of db.documents) {
    for (const cat of doc.categories) {
      for (const sec of cat.sections) {
        for (const cmd of sec.commands) {
          entries.push({
            docName: doc.fileName,
            categoryTitle: cat.title,
            sectionTitle: sec.title,
            commandCode: cmd.code,
            commandDescription: cmd.description ?? "",
            anchorId: buildAnchorId(doc.fileName, cat.title, sec.title),
          });
        }
      }
    }
  }

  return entries;
}

/** Fuse.js configuration tuned for pentesting command search */
const FUSE_OPTIONS: IFuseOptions<SearchEntry> = {
  keys: [
    { name: "categoryTitle", weight: 0.3 },
    { name: "sectionTitle", weight: 0.35 },
    { name: "commandCode", weight: 0.2 },
    { name: "commandDescription", weight: 0.15 },
  ],
  threshold: 0.3,
  includeMatches: true,
  minMatchCharLength: 2,
};

/**
 * useSmartSearch -- fuzzy search hook powered by Fuse.js.
 *
 * Flattens the Onyx database once on mount, builds a Fuse index, and
 * exposes a simple `search(query)` function that returns ranked results.
 *
 * @param db - The full Onyx database loaded from onyx-db.json
 * @returns Object containing the search function and flattened entries
 */
export function useSmartSearch(db: OnyxDatabase) {
  const { entries, fuse } = useMemo(() => {
    const flatEntries = flattenDatabase(db);
    const fuseInstance = new Fuse(flatEntries, FUSE_OPTIONS);
    return { entries: flatEntries, fuse: fuseInstance };
  }, [db]);

  /**
   * Runs a fuzzy search against all commands, sections and categories.
   * Returns an empty array for queries shorter than 2 characters.
   */
  const search = (query: string): FuseResult<SearchEntry>[] => {
    if (query.length < 2) return [];
    return fuse.search(query, { limit: 20 });
  };

  return { search, entries };
}
