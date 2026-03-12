import { ChevronRight } from "lucide-react";
import type { SearchEntry } from "@/hooks/useSmartSearch";

/** Match index tuple: [startIndex, endIndex] */
type RangeTuple = readonly [number, number];

/** Fuse.js match metadata for a single field */
interface FuseMatch {
  key?: string;
  indices: readonly RangeTuple[];
}

/** Fuse.js result shape for a SearchEntry */
interface FuseResult {
  item: SearchEntry;
  refIndex: number;
  matches?: readonly FuseMatch[];
}

/**
 * Highlights matched characters in a text string using Fuse.js match indices.
 * Returns an array of React nodes with matched portions wrapped in a styled span.
 */
function highlightMatches(
  text: string,
  indices: readonly RangeTuple[] | undefined,
): React.ReactNode[] {
  if (!indices || indices.length === 0) {
    return [text];
  }

  const nodes: React.ReactNode[] = [];
  let lastEnd = 0;

  for (const [start, end] of indices) {
    if (start > lastEnd) {
      nodes.push(text.slice(lastEnd, start));
    }
    nodes.push(
      <span key={start} className="text-[#7d7af7] font-medium">
        {text.slice(start, end + 1)}
      </span>,
    );
    lastEnd = end + 1;
  }

  if (lastEnd < text.length) {
    nodes.push(text.slice(lastEnd));
  }

  return nodes;
}

/**
 * SearchResultItem -- renders a single search result with hierarchy breadcrumb.
 *
 * Shows category > section path and a command/description preview.
 * Clicking scrolls to the matching section and clears the query.
 */
export default function SearchResultItem({
  result,
  onSelect,
}: {
  result: FuseResult;
  onSelect: (anchorId: string) => void;
}) {
  const { item, matches } = result;

  /** Find match indices for the section title (most useful highlight) */
  const sectionMatch = matches?.find((m) => m.key === "sectionTitle");
  const codeMatch = matches?.find((m) => m.key === "commandCode");
  const descMatch = matches?.find((m) => m.key === "commandDescription");

  /** Build a short preview of the command (first 120 chars) */
  const preview = item.commandDescription
    ? item.commandDescription.slice(0, 120)
    : item.commandCode.split("\n")[0].slice(0, 120);

  const previewMatch = descMatch ?? codeMatch;

  return (
    <button
      onClick={() => onSelect(item.anchorId)}
      className="group flex w-full flex-col gap-1 rounded-md border-l-2 border-transparent px-3 py-2.5 text-left transition-colors hover:border-[#7d7af7] hover:bg-[#333333]"
    >
      {/* Breadcrumb: category > section */}
      <div className="flex items-center gap-1 text-xs text-[#8b8b8b]">
        <span className="truncate max-w-[200px]">{item.categoryTitle}</span>
        <ChevronRight size={10} className="shrink-0" />
        <span className="truncate text-[#d4d4d4]">
          {sectionMatch
            ? highlightMatches(item.sectionTitle, sectionMatch.indices)
            : item.sectionTitle}
        </span>
      </div>

      {/* Command preview */}
      <p className="truncate font-mono text-sm text-[#8b8b8b] group-hover:text-[#d4d4d4]">
        {previewMatch
          ? highlightMatches(preview, previewMatch.indices)
          : preview}
      </p>

      {/* Document source */}
      <span className="text-[10px] text-[#555555]">{item.docName}</span>
    </button>
  );
}
