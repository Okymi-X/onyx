"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Command } from "lucide-react";
import { useSmartSearch } from "@/hooks/useSmartSearch";
import SearchResultItem from "@/components/search/SearchResultItem";
import type { OnyxDatabase } from "@/types/onyx";
import onyxDb from "@/data/onyx-db.json";

const db = onyxDb as unknown as OnyxDatabase;

/**
 * SearchBar -- global fuzzy search with keyboard shortcut (Ctrl+K).
 *
 * Renders a search input with a floating dropdown of results.
 * Clicking a result scrolls to the matching section and closes the panel.
 */
export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { search } = useSmartSearch(db);

  const results = search(query);

  /** Close the dropdown when clicking outside */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /** Ctrl+K / Cmd+K keyboard shortcut to focus the search bar */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  /** Navigate to the selected section and reset the search state */
  const handleSelect = useCallback((anchorId: string) => {
    const el = document.getElementById(anchorId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setQuery("");
    setIsOpen(false);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto">
      {/* Search input */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b8b8b]"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search commands, sections, categories..."
          spellCheck={false}
          autoComplete="off"
          className="w-full rounded-lg border border-[#333333] bg-[#1a1a1a] py-2.5 pl-10 pr-20 text-sm text-[#d4d4d4] placeholder-[#555555] outline-none transition-colors focus:border-[#7d7af7] focus:ring-1 focus:ring-[#7d7af7]"
        />

        {/* Right side: clear button + shortcut hint */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {query.length > 0 && (
            <button
              onClick={() => { setQuery(""); setIsOpen(false); }}
              className="rounded p-0.5 text-[#8b8b8b] hover:text-[#d4d4d4]"
            >
              <X size={14} />
            </button>
          )}
          <kbd className="hidden items-center gap-0.5 rounded border border-[#333333] bg-[#252525] px-1.5 py-0.5 text-[10px] text-[#8b8b8b] sm:flex">
            <Command size={10} />K
          </kbd>
        </div>
      </div>

      {/* Results dropdown */}
      {isOpen && query.length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-lg border border-[#333333] bg-[#252525] shadow-xl shadow-black/50">
          {results.length > 0 ? (
            <div className="divide-y divide-[#333333]">
              {results.map((result) => (
                <SearchResultItem
                  key={`${result.item.anchorId}-${result.refIndex}`}
                  result={result}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-sm text-[#8b8b8b]">
              No results for &quot;{query}&quot;
            </div>
          )}
        </div>
      )}
    </div>
  );
}
