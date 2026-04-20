import type { Metadata } from 'next';
import type { PostsDatabase } from '@/types/blog';
import postsDb from '@/data/posts-db.json';
import BlogPageClient from '@/components/blog/BlogPageClient';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Blog — Onyx',
  description: 'Security articles, CTF write-ups, and pentesting notes.',
};

const db = postsDb as unknown as PostsDatabase;

export default function BlogPage() {
  return (
    <Suspense>
      <BlogPageClient posts={db.posts} />
    </Suspense>
  );
}
