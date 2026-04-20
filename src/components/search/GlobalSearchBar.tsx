'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Search, X, Terminal, FileText } from 'lucide-react';
import { useSmartSearch } from '@/hooks/useSmartSearch';
import { useBlogSearch } from '@/hooks/useBlogSearch';
import { POST_TYPE_THEMES } from '@/lib/postUtils';
import type { OnyxDatabase } from '@/types/onyx';
import type { PostsDatabase } from '@/types/blog';
import onyxDb from '@/data/onyx-db.json';
import postsDb from '@/data/posts-db.json';

const db = onyxDb as unknown as OnyxDatabase;
const pdb = postsDb as unknown as PostsDatabase;

export default function GlobalSearchBar() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const isOnCheatsheets = pathname.startsWith('/cheatsheets');

  const { search: searchCommands } = useSmartSearch(db);
  const { search: searchPosts } = useBlogSearch(pdb.posts);

  const commandResults = query.length >= 2 ? searchCommands(query).slice(0, 5) : [];
  const postResults = query.length >= 2 ? searchPosts(query).slice(0, 5) : [];

  const openSearch = useCallback(() => {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const closeSearch = useCallback(() => {
    setOpen(false);
    setQuery('');
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (open) { closeSearch(); } else { openSearch(); }
      }
      if (e.key === 'Escape') closeSearch();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, openSearch, closeSearch]);

  const handleCommandClick = (anchorId: string) => {
    closeSearch();
    if (isOnCheatsheets) {
      const el = document.getElementById(anchorId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      router.push(`/cheatsheets#${anchorId}`);
    }
  };

  const handlePostClick = (slug: string) => {
    closeSearch();
    router.push(`/blog/${slug}`);
  };

  const hasResults = commandResults.length > 0 || postResults.length > 0;

  return (
    <>
      <button
        onClick={openSearch}
        className="flex items-center gap-2 rounded-md border border-[#333333] bg-[#1e1e1e] px-3 py-1.5 text-xs text-[#6b6b6b] transition-colors hover:border-[#444444] hover:text-[#9e9e9e]"
      >
        <Search size={12} />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden rounded border border-[#333333] bg-[#252525] px-1.5 py-0.5 font-mono text-[10px] sm:inline">
          ⌘K
        </kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4" onClick={closeSearch}>
          <div
            className="w-full max-w-xl rounded-xl border border-[#3e3e3e] bg-[#1e1e1e] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Input */}
            <div className="flex items-center gap-3 border-b border-[#2e2e2e] px-4 py-3">
              <Search size={15} className="shrink-0 text-[#6b6b6b]" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search commands, articles, write-ups..."
                className="flex-1 bg-transparent text-sm text-[#d4d4d4] placeholder-[#555555] outline-none"
              />
              {query && (
                <button onClick={() => setQuery('')} className="text-[#6b6b6b] hover:text-[#9e9e9e]">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto">
              {query.length >= 2 && !hasResults && (
                <p className="px-4 py-6 text-center text-sm text-[#6b6b6b]">No results for &ldquo;{query}&rdquo;</p>
              )}

              {/* Command results */}
              {commandResults.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 border-b border-[#2e2e2e] px-4 py-2">
                    <Terminal size={11} className="text-[#569CD6]" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#569CD6]">Commands</span>
                  </div>
                  {commandResults.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => handleCommandClick(r.item.anchorId)}
                      className="w-full border-b border-[#2a2a2a] px-4 py-3 text-left transition-colors hover:bg-[#252525]"
                    >
                      <div className="text-[11px] text-[#6b6b6b]">
                        {r.item.categoryTitle} › {r.item.sectionTitle}
                      </div>
                      <div className="mt-0.5 truncate font-mono text-xs text-[#9e9e9e]">
                        {r.item.commandCode.split('\n')[0].slice(0, 80)}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Post results */}
              {postResults.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 border-b border-[#2e2e2e] px-4 py-2">
                    <FileText size={11} className="text-[#4EC9B0]" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#4EC9B0]">Blog</span>
                  </div>
                  {postResults.map((r, i) => {
                    const theme = POST_TYPE_THEMES[r.item.type as keyof typeof POST_TYPE_THEMES];
                    return (
                      <button
                        key={i}
                        onClick={() => handlePostClick(r.item.slug)}
                        className="w-full border-b border-[#2a2a2a] px-4 py-3 text-left transition-colors hover:bg-[#252525]"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase"
                            style={{ color: theme?.color, backgroundColor: theme?.bgColor }}
                          >
                            {theme?.label}
                          </span>
                        </div>
                        <div className="mt-0.5 text-xs font-medium text-[#d4d4d4]">{r.item.title}</div>
                        <div className="mt-0.5 truncate text-[11px] text-[#6b6b6b]">{r.item.summary}</div>
                      </button>
                    );
                  })}
                </div>
              )}

              {query.length < 2 && (
                <p className="px-4 py-6 text-center text-xs text-[#555555]">Type to search across commands and posts</p>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-[#2e2e2e] px-4 py-2">
              <span className="text-[10px] text-[#555555]">↵ to select · Esc to close</span>
              <span className="text-[10px] text-[#555555]">{commandResults.length + postResults.length} results</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
