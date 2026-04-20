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
    <main>
      <HeroSection />
      <StatsBar
        commandCount={db.commandCount}
        docCount={db.documentCount}
        postCount={pdb.postCount}
      />

      {/* Recent posts */}
      {recentPosts.length > 0 && (
        <section className="mx-auto mb-16 max-w-4xl px-4 sm:px-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Recent Posts</h2>
            <Link href="/blog" className="text-xs text-[#7d7af7] hover:underline">
              View all →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentPosts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        </section>
      )}

      {/* Cheat sheets teaser */}
      <section className="mx-auto mb-16 max-w-4xl px-4 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            <Terminal size={16} className="mr-2 inline text-[#569CD6]" />
            Command References
          </h2>
          <Link href="/cheatsheets" className="text-xs text-[#569CD6] hover:underline">
            Open cheat sheets →
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {db.documents.slice(0, 6).map((doc) => (
            <Link
              key={doc.fileName}
              href={`/cheatsheets#${doc.fileName}`}
              className="flex items-center justify-between rounded-lg border border-[#2e2e2e] bg-[#1e1e1e] px-4 py-3 text-sm transition-colors hover:border-[#569CD6]/40 hover:bg-[#252525]"
            >
              <span className="text-[#d4d4d4]">{doc.fileName}</span>
              <ArrowUpRight size={13} className="text-[#555555]" />
            </Link>
          ))}
        </div>
      </section>

      {/* GitHub CTA */}
      <section className="mx-auto mb-16 max-w-4xl px-4 sm:px-6">
        <div className="rounded-2xl border border-[#4b48a8] bg-[linear-gradient(180deg,#27205a,#1d173f)] p-6 shadow-[0_14px_30px_rgba(56,40,140,0.25)]">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#c9c6ff]">
                <Github size={13} />
                Open Source
              </div>
              <h3 className="text-xl font-semibold text-white">
                Star the repo and contribute.
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#d5d2ff]">
                Improve commands, add write-ups, fix inaccuracies. Every contribution makes the reference sharper.
              </p>
              <div className="mt-2 flex items-center gap-2 text-xs text-[#9a97ff]">
                <HeartHandshake size={12} />
                Community contributions welcome
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:items-end">
              <a
                href={REPO_URL}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
              >
                <Star size={14} />
                Leave a star
              </a>
              <a
                href={REPO_URL}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-sm text-[#d5d2ff] hover:text-white"
              >
                <ArrowUpRight size={14} />
                Open repo
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
