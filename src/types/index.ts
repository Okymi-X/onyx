/**
 * Type definitions for the Onyx pentesting command reference application.
 * Central type registry to ensure consistency across all modules.
 */

/** Target variables managed in the global Zustand store */
export interface TargetVariables {
  targetIP: string;
  targetDomain: string;
  targetDC: string;
  targetUser: string;
  targetPassword: string;
  localIP: string;
  localPort: string;
}

/** Actions available on the target store */
export interface TargetActions {
  setTargetIP: (value: string) => void;
  setTargetDomain: (value: string) => void;
  setTargetDC: (value: string) => void;
  setTargetUser: (value: string) => void;
  setTargetPassword: (value: string) => void;
  setLocalIP: (value: string) => void;
  setLocalPort: (value: string) => void;
  resetAll: () => void;
}

/** Combined store type (state + actions) */
export type TargetStore = TargetVariables & TargetActions;

/** A single command block extracted from a Markdown file */
export interface CommandBlock {
  id: string;
  language: string;
  rawContent: string;
  hydratedContent: string;
}

/** A section within a category (e.g., ## Enumeration > ### SMB) */
export interface Section {
  id: string;
  title: string;
  depth: number;
  commands: CommandBlock[];
}

/** A top-level category derived from a Markdown file or H2 heading */
export interface Category {
  id: string;
  name: string;
  fileName: string;
  sections: Section[];
}

/** Search result item returned by Fuse.js */
export interface SearchResult {
  categoryId: string;
  categoryName: string;
  sectionId: string;
  sectionTitle: string;
  commandPreview: string;
}
