'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import type { BlogPost, TocEntry } from '@/types/blog';
import PostTypeBadge from './PostTypeBadge';
import RelatedPosts from './RelatedPosts';
import {
  extractToc,
  slugifyHeading,
  formatPostDate,
  getDifficultyColor,
} from '@/lib/postUtils';
import { ArrowLeft, Clock, Copy, Check } from 'lucide-react';

interface Props {
  post: BlogPost;
  allPosts: BlogPost[];
}

/* ------------------------------------------------------------------ */
/*  Copy button for code blocks                                        */
/* ------------------------------------------------------------------ */

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <button
      onClick={handleCopy}
      className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-md border border-[#333333] bg-[#252525] text-[#6b6b6b] transition-colors hover:border-[#7d7af7] hover:text-[#7d7af7]"
      title="Copy code"
    >
      {copied ? <Check size={12} className="text-[#4EC9B0]" /> : <Copy size={12} />}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Language badge                                                     */
/* ------------------------------------------------------------------ */

const LANG_COLORS: Record<string, string> = {
  bash: '#4EC9B0',
  sh: '#4EC9B0',
  zsh: '#4EC9B0',
  powershell: '#569CD6',
  ps1: '#569CD6',
  python: '#D7BA7D',
  py: '#D7BA7D',
  sql: '#F44747',
  cypher: '#9B99FF',
  text: '#6b6b6b',
};

function langColor(lang: string): string {
  return LANG_COLORS[lang.toLowerCase()] ?? '#7D7AF7';
}

/* ------------------------------------------------------------------ */
/*  ReactMarkdown component overrides                                  */
/* ------------------------------------------------------------------ */

function buildComponents(): Components {
  return {
    /* Headings with anchor IDs */
    h1: ({ children }) => (
      <h1 className="mb-4 mt-12 text-2xl font-bold text-white first:mt-0">{children}</h1>
    ),
    h2: ({ children }) => {
      const id = slugifyHeading(String(children));
      return (
        <h2 id={id} className="mb-3 mt-10 border-b border-[#2e2e2e] pb-2 text-xl font-bold text-white scroll-mt-20">
          {children}
        </h2>
      );
    },
    h3: ({ children }) => {
      const id = slugifyHeading(String(children));
      return (
        <h3 id={id} className="mb-2 mt-8 text-lg font-semibold text-[#d4d4d4] scroll-mt-20">
          {children}
        </h3>
      );
    },
    h4: ({ children }) => (
      <h4 className="mb-2 mt-6 text-base font-semibold text-[#d4d4d4]">{children}</h4>
    ),

    /* Paragraphs */
    p: ({ children }) => (
      <p className="mb-4 leading-7 text-[#b5b5b5]">{children}</p>
    ),

    /* Inline code */
    code: ({ children, className, ...props }) => {
      const match = /language-(\w+)/.exec(className ?? '');
      const lang = match?.[1] ?? '';
      const isBlock = Boolean(match);

      if (!isBlock) {
        return (
          <code className="mx-0.5 rounded bg-[#2a2a2a] px-1.5 py-0.5 font-mono text-sm text-[#9b99ff]">
            {children}
          </code>
        );
      }

      const code = String(children).replace(/\n$/, '');
      const color = langColor(lang);

      return (
        <div className="group relative my-5 overflow-hidden rounded-lg border border-[#2e2e2e] bg-[#141414]">
          {/* Header bar */}
          <div className="flex items-center justify-between border-b border-[#2a2a2a] px-4 py-2">
            <span
              className="rounded px-2 py-0.5 font-mono text-[10px] font-semibold uppercase"
              style={{ color, backgroundColor: `${color}18` }}
            >
              {lang || 'text'}
            </span>
            <CopyButton code={code} />
          </div>
          {/* Code */}
          <pre className="overflow-x-auto px-4 py-4">
            <code
              className="font-mono text-sm leading-relaxed text-[#d4d4d4]"
              {...props}
            >
              {code}
            </code>
          </pre>
        </div>
      );
    },

    /* Pre wrapper — ReactMarkdown wraps fenced blocks in pre>code; we handle at code level */
    pre: ({ children }) => <>{children}</>,

    /* Blockquote */
    blockquote: ({ children }) => (
      <blockquote className="my-5 border-l-2 border-[#7d7af7] py-1 pl-4 italic text-[#9e9e9e]">
        {children}
      </blockquote>
    ),

    /* Links */
    a: ({ href, children }) => (
      <a
        href={href}
        className="text-[#7d7af7] underline-offset-2 hover:underline"
        target={href?.startsWith('http') ? '_blank' : undefined}
        rel={href?.startsWith('http') ? 'noreferrer' : undefined}
      >
        {children}
      </a>
    ),

    /* Images — responsive, with optional caption via alt text */
    img: ({ src, alt }) => {
      const srcStr = typeof src === 'string' ? src : '';
      return (
      <figure className="my-6">
        <div className="overflow-hidden rounded-lg border border-[#2e2e2e]">
          {/* Use next/image if src is local, otherwise plain img */}
          {srcStr.startsWith('/') ? (
            <Image
              src={srcStr}
              alt={alt ?? ''}
              width={900}
              height={500}
              className="w-full object-contain"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={srcStr}
              alt={alt ?? ''}
              className="w-full rounded-lg"
              loading="lazy"
            />
          )}
        </div>
        {alt && (
          <figcaption className="mt-2 text-center text-xs text-[#6b6b6b]">{alt}</figcaption>
        )}
      </figure>
      );
    },

    /* Lists */
    ul: ({ children }) => (
      <ul className="mb-4 list-disc space-y-1 pl-6 text-[#b5b5b5] marker:text-[#555555]">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="mb-4 list-decimal space-y-1 pl-6 text-[#b5b5b5]">{children}</ol>
    ),
    li: ({ children }) => <li className="leading-7">{children}</li>,

    /* Horizontal rule */
    hr: () => <hr className="my-8 border-[#2e2e2e]" />,

    /* Strong / em */
    strong: ({ children }) => <strong className="font-semibold text-[#d4d4d4]">{children}</strong>,
    em: ({ children }) => <em className="italic text-[#9e9e9e]">{children}</em>,

    /* Tables (remark-gfm) */
    table: ({ children }) => (
      <div className="my-6 overflow-x-auto rounded-lg border border-[#2e2e2e]">
        <table className="w-full border-collapse text-sm">{children}</table>
      </div>
    ),
    thead: ({ children }) => <thead className="bg-[#252525]">{children}</thead>,
    tbody: ({ children }) => <tbody className="divide-y divide-[#2a2a2a]">{children}</tbody>,
    tr: ({ children }) => <tr>{children}</tr>,
    th: ({ children }) => (
      <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-[#9e9e9e]">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-4 py-2.5 text-sm text-[#b5b5b5]">{children}</td>
    ),
  };
}

/* ------------------------------------------------------------------ */
/*  TOC                                                                */
/* ------------------------------------------------------------------ */

function TableOfContents({ entries, activeId }: { entries: TocEntry[]; activeId: string }) {
  if (entries.length === 0) return null;

  return (
    <nav className="hidden lg:block">
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-[#555555]">
        On this page
      </p>
      <ul className="space-y-1">
        {entries.map((entry) => (
          <li key={entry.id}>
            <a
              href={`#${entry.id}`}
              className={`block truncate py-0.5 text-xs transition-colors ${
                entry.level === 3 ? 'pl-3' : ''
              } ${
                activeId === entry.id
                  ? 'font-medium text-[#7d7af7]'
                  : 'text-[#6b6b6b] hover:text-[#9e9e9e]'
              }`}
            >
              {entry.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function PostDetail({ post, allPosts }: Props) {
  const [activeId, setActiveId] = useState('');
  const toc = extractToc(post.body);

  // Scroll-spy
  useEffect(() => {
    if (toc.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '-14px 0px -60% 0px', threshold: 0 },
    );

    toc.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [toc]);

  const components = buildComponents();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex gap-12">
        {/* Main content */}
        <article className="min-w-0 flex-1">
          {/* Back */}
          <Link
            href="/blog"
            className="mb-8 inline-flex items-center gap-1.5 text-xs text-[#6b6b6b] transition-colors hover:text-[#9e9e9e]"
          >
            <ArrowLeft size={12} />
            Back to Blog
          </Link>

          {/* Metadata */}
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <PostTypeBadge type={post.type} size="md" />
            {post.platform && (
              <span className="text-xs text-[#6b6b6b]">{post.platform}</span>
            )}
            {post.difficulty && (
              <span
                className="rounded px-2 py-0.5 text-xs font-semibold capitalize"
                style={{
                  color: getDifficultyColor(post.difficulty),
                  backgroundColor: `${getDifficultyColor(post.difficulty)}18`,
                }}
              >
                {post.difficulty}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="mb-4 text-2xl font-bold leading-tight text-white sm:text-3xl">
            {post.title}
          </h1>

          {/* Summary */}
          <p className="mb-6 text-base leading-7 text-[#9e9e9e]">{post.summary}</p>

          {/* Sub-metadata */}
          <div className="mb-8 flex flex-wrap items-center gap-4 border-b border-[#2e2e2e] pb-6 text-xs text-[#6b6b6b]">
            <span>{formatPostDate(post.date)}</span>
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {post.readingTimeMinutes} min read
            </span>
            <span>{post.wordCount.toLocaleString()} words</span>
          </div>

          {/* Cover image */}
          {post.coverImage && (
            <div className="mb-8 overflow-hidden rounded-xl border border-[#2e2e2e]">
              <Image
                src={post.coverImage}
                alt={post.title}
                width={900}
                height={450}
                className="w-full object-cover"
              />
            </div>
          )}

          {/* Body */}
          <div className="prose-custom">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
              {post.body}
            </ReactMarkdown>
          </div>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="mt-10 flex flex-wrap gap-2 border-t border-[#2e2e2e] pt-6">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-[#252525] px-2.5 py-1 text-xs text-[#6b6b6b]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Related posts */}
          <RelatedPosts currentPost={post} allPosts={allPosts} />
        </article>

        {/* TOC sidebar */}
        {toc.length > 0 && (
          <aside className="hidden w-56 shrink-0 lg:block">
            <div className="sticky top-24">
              <TableOfContents entries={toc} activeId={activeId} />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
