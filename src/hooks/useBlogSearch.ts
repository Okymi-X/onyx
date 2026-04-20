'use client';

import { useMemo } from 'react';
import Fuse, { type IFuseOptions } from 'fuse.js';
import type { BlogPost } from '@/types/blog';

export interface BlogSearchEntry {
  slug: string;
  title: string;
  type: string;
  summary: string;
  tagsJoined: string;
  bodyPreview: string;
}

const FUSE_OPTIONS: IFuseOptions<BlogSearchEntry> = {
  keys: [
    { name: 'title',       weight: 0.4 },
    { name: 'tagsJoined',  weight: 0.3 },
    { name: 'summary',     weight: 0.2 },
    { name: 'bodyPreview', weight: 0.1 },
  ],
  threshold: 0.35,
  includeMatches: true,
  minMatchCharLength: 2,
};

export function useBlogSearch(posts: BlogPost[]) {
  const { entries, fuse } = useMemo(() => {
    const flatEntries: BlogSearchEntry[] = posts.map((p) => ({
      slug: p.slug,
      title: p.title,
      type: p.type,
      summary: p.summary,
      tagsJoined: p.tags.join(' '),
      bodyPreview: p.body.slice(0, 500),
    }));
    return { entries: flatEntries, fuse: new Fuse(flatEntries, FUSE_OPTIONS) };
  }, [posts]);

  const search = (query: string) => {
    if (query.length < 2) return [];
    return fuse.search(query, { limit: 10 });
  };

  return { search, entries };
}
