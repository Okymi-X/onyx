'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { BlogPost, PostType } from '@/types/blog';
import PostCard from './PostCard';
import { POST_TYPE_THEMES } from '@/lib/postUtils';

interface Props {
  posts: BlogPost[];
}

type Filter = PostType | 'all';

const FILTERS: { value: Filter; label: string; color: string }[] = [
  { value: 'all',     label: 'All',       color: '#9e9e9e' },
  { value: 'article', label: 'Articles',  color: POST_TYPE_THEMES.article.color },
  { value: 'writeup', label: 'Write-ups', color: POST_TYPE_THEMES.writeup.color },
  { value: 'note',    label: 'Notes',     color: POST_TYPE_THEMES.note.color },
];

export default function BlogPageClient({ posts }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<Filter>('all');

  useEffect(() => {
    const type = searchParams.get('type') as Filter | null;
    if (type && ['article', 'writeup', 'note'].includes(type)) {
      setActiveFilter(type);
    } else {
      setActiveFilter('all');
    }
  }, [searchParams]);

  const handleFilter = (filter: Filter) => {
    setActiveFilter(filter);
    if (filter === 'all') {
      router.replace('/blog');
    } else {
      router.replace(`/blog?type=${filter}`);
    }
  };

  const filtered = activeFilter === 'all' ? posts : posts.filter((p) => p.type === activeFilter);
  const countFor = (type: Filter) =>
    type === 'all' ? posts.length : posts.filter((p) => p.type === type).length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      {/* Header */}
      <div className="mb-10">
        <h1 className="mb-2 text-3xl font-bold text-white">Blog</h1>
        <p className="text-sm text-[#555555]">
          Articles, CTF write-ups, and security notes.
        </p>
      </div>

      {/* Filter pills */}
      <div className="mb-8 flex flex-wrap gap-2">
        {FILTERS.map(({ value, label, color }) => {
          const isActive = activeFilter === value;
          const count = countFor(value);
          return (
            <button
              key={value}
              onClick={() => handleFilter(value)}
              className="flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium transition-all duration-150"
              style={{
                color: isActive ? color : '#555555',
                borderColor: isActive ? `${color}40` : '#222222',
                backgroundColor: isActive ? `${color}10` : 'transparent',
              }}
            >
              {label}
              <span
                className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums"
                style={{
                  color: isActive ? color : '#3a3a3a',
                  backgroundColor: isActive ? `${color}18` : '#1a1a1a',
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Posts grid */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-[#1e1e1e] py-20 text-center">
          <p className="text-sm text-[#444444]">No posts yet in this category.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
