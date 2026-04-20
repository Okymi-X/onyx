import Link from 'next/link';
import type { OnyxDatabase } from '@/types/onyx';
import type { PostsDatabase } from '@/types/blog';
import onyxDb from '@/data/onyx-db.json';
import postsDb from '@/data/posts-db.json';
import HeroSection from '@/components/home/HeroSection';
import StatsBar from '@/components/home/StatsBar';
import PostCard from '@/components/blog/PostCard';
import { Github, Star, ArrowUpRight, Terminal, HeartHandshake } from 'lucide-react';

const db = onyxDb as unknown as OnyxDatabase;
const pdb = postsDb as unknown as PostsDatabase;
const REPO_URL = 'https://github.com/Okymi-X/onyx';

export default function HomePage() {
  const recentPosts = pdb.posts.slice(0, 6);

  return (
    <main className="min-h-screen">
      <HeroSection />
      <StatsBar
        commandCount={db.commandCount}
        docCount={db.documentCount}
        postCount={pdb.postCount}
      />

      {/* Recent posts */}
      {recentPosts.length > 0 && (
        <section className="mx-auto mb-20 max-w-4xl px-4 sm:px-6">
          <div className="mb-6 flex items-center justify-between border-b border-[#1e1e1e] pb-4">
            <h2 className="text-base font-semibold text-[#9e9e9e]">Recent Posts</h2>
            <Link href="/blog" className="flex items-center gap-1 text-xs text-[#7d7af7] transition-colors hover:text-[#9b99ff]">
              All posts <ArrowUpRight size={11} />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recentPosts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        </section>
      )}

      {/* Cheat sheets teaser */}
      <section className="mx-auto mb-20 max-w-4xl px-4 sm:px-6">
        <div className="mb-6 flex items-center justify-between border-b border-[#1e1e1e] pb-4">
          <h2 className="flex items-center gap-2 text-base font-semibold text-[#9e9e9e]">
            <Terminal size={14} className="text-[#569CD6]" />
            Command References
          </h2>
          <Link href="/cheatsheets" className="flex items-center gap-1 text-xs text-[#569CD6] transition-colors hover:text-[#7db8e8]">
            Open tool <ArrowUpRight size={11} />
          </Link>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {db.documents.slice(0, 6).map((doc) => (
            <Link
              key={doc.fileName}
              href={`/cheatsheets#${doc.fileName}`}
              className="group flex items-center justify-between rounded-lg border border-[#1e1e1e] bg-[#141414] px-4 py-3 text-sm transition-all hover:border-[#2a2a2a] hover:bg-[#1a1a1a]"
            >
              <span className="text-[#6b6b6b] transition-colors group-hover:text-[#9e9e9e]">{doc.fileName}</span>
              <ArrowUpRight size={12} className="text-[#2a2a2a] transition-colors group-hover:text-[#555555]" />
            </Link>
          ))}
        </div>
      </section>

      {/* GitHub CTA */}
      <section className="mx-auto mb-20 max-w-4xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-2xl border border-[#2d2a5e] bg-[#0f0d1f] p-8">
          {/* Glow */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#7d7af7]/10 blur-[60px]" />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-[#7d7af7]">
                <Github size={12} />
                Open Source
              </div>
              <h3 className="mb-2 text-xl font-bold text-white">
                Star the repo and contribute.
              </h3>
              <p className="text-sm leading-relaxed text-[#6060a0]">
                Improve commands, add write-ups, fix inaccuracies.
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs text-[#555580]">
                <HeartHandshake size={12} />
                Contributions welcome
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-2">
              <a
                href={REPO_URL}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-lg bg-[#7d7af7] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(125,122,247,0.25)] transition-all hover:bg-[#9b99ff]"
              >
                <Star size={13} />
                Leave a star
              </a>
              <a
                href={REPO_URL}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 text-sm text-[#555580] hover:text-[#9b99ff]"
              >
                <ArrowUpRight size={13} />
                Open on GitHub
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
