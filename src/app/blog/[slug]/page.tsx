import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { PostsDatabase } from '@/types/blog';
import postsDb from '@/data/posts-db.json';
import PostDetail from '@/components/blog/PostDetail';

const db = postsDb as unknown as PostsDatabase;

export function generateStaticParams() {
  return db.posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = db.posts.find((p) => p.slug === slug);
  if (!post) return { title: 'Not Found — Onyx' };
  return {
    title: `${post.title} — Onyx`,
    description: post.summary,
  };
}

export default async function SlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = db.posts.find((p) => p.slug === slug);
  if (!post) notFound();
  return <PostDetail post={post} allPosts={db.posts} />;
}
