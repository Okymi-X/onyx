import Link from 'next/link';
import type { BlogPost } from '@/types/blog';
import PostTypeBadge from './PostTypeBadge';
import { formatPostDate, getDifficultyColor } from '@/lib/postUtils';
import { Clock, ArrowUpRight } from 'lucide-react';

interface Props {
  post: BlogPost;
  featured?: boolean;
}

export default function PostCard({ post, featured = false }: Props) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className={`group relative flex flex-col overflow-hidden rounded-xl border border-[#222222] bg-[#171717] transition-all duration-200 hover:border-[#2e2e2e] hover:bg-[#1c1c1c] ${
        featured ? 'p-6' : 'p-5'
      }`}
    >
      {/* Top row */}
      <div className="mb-3.5 flex items-center justify-between">
        <PostTypeBadge type={post.type} />
        <span className="text-[11px] tabular-nums text-[#444444]">{formatPostDate(post.date)}</span>
      </div>

      {/* Title */}
      <h3
        className={`mb-2.5 font-semibold leading-snug text-[#b5b5b5] transition-colors duration-150 group-hover:text-white ${
          featured ? 'text-base' : 'text-sm'
        }`}
      >
        {post.title}
      </h3>

      {/* Summary */}
      <p className="mb-4 flex-1 text-xs leading-relaxed text-[#4a4a4a] line-clamp-3">
        {post.summary}
      </p>

      {/* Footer */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Platform */}
        {post.platform && (
          <span className="text-[10px] font-medium text-[#555555]">{post.platform}</span>
        )}
        {/* Difficulty */}
        {post.difficulty && (
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize"
            style={{
              color: getDifficultyColor(post.difficulty),
              backgroundColor: `${getDifficultyColor(post.difficulty)}15`,
            }}
          >
            {post.difficulty}
          </span>
        )}

        {/* Tags */}
        <div className="flex flex-1 flex-wrap gap-1">
          {post.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="rounded bg-[#202020] px-1.5 py-0.5 text-[10px] text-[#444444]"
            >
              #{tag}
            </span>
          ))}
          {post.tags.length > 2 && (
            <span className="text-[10px] text-[#383838]">+{post.tags.length - 2}</span>
          )}
        </div>

        {/* Reading time + arrow */}
        <div className="ml-auto flex items-center gap-2">
          <span className="flex items-center gap-1 text-[10px] text-[#3a3a3a]">
            <Clock size={9} />
            {post.readingTimeMinutes} min
          </span>
          <ArrowUpRight
            size={13}
            className="text-[#2e2e2e] transition-colors group-hover:text-[#6b6b6b]"
          />
        </div>
      </div>
    </Link>
  );
}
