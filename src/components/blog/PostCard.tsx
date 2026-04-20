import Link from 'next/link';
import type { BlogPost } from '@/types/blog';
import PostTypeBadge from './PostTypeBadge';
import { formatPostDate, getDifficultyColor } from '@/lib/postUtils';
import { Clock } from 'lucide-react';

interface Props {
  post: BlogPost;
}

export default function PostCard({ post }: Props) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col rounded-xl border border-[#2e2e2e] bg-[#202020] p-5 transition-all duration-200 hover:bg-[#252525]"
    >
      {/* Top row */}
      <div className="mb-3 flex items-center justify-between">
        <PostTypeBadge type={post.type} />
        <span className="text-[11px] text-[#6b6b6b]">{formatPostDate(post.date)}</span>
      </div>

      {/* Title */}
      <h3
        className="mb-2 text-sm font-semibold leading-snug text-[#d4d4d4] transition-colors group-hover:text-white"
        style={{ color: undefined }}
      >
        {post.title}
      </h3>

      {/* Summary */}
      <p className="mb-4 flex-1 text-xs leading-relaxed text-[#6b6b6b] line-clamp-3">
        {post.summary}
      </p>

      {/* Footer */}
      <div className="flex flex-wrap items-center gap-2">
        {post.platform && (
          <span className="text-[10px] text-[#6b6b6b]">{post.platform}</span>
        )}
        {post.difficulty && (
          <span
            className="rounded px-1.5 py-0.5 text-[10px] font-semibold capitalize"
            style={{
              color: getDifficultyColor(post.difficulty),
              backgroundColor: `${getDifficultyColor(post.difficulty)}18`,
            }}
          >
            {post.difficulty}
          </span>
        )}

        <div className="flex flex-1 flex-wrap gap-1">
          {post.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded bg-[#2a2a2a] px-1.5 py-0.5 text-[10px] text-[#6b6b6b]"
            >
              #{tag}
            </span>
          ))}
          {post.tags.length > 3 && (
            <span className="text-[10px] text-[#555555]">+{post.tags.length - 3}</span>
          )}
        </div>

        <span className="ml-auto flex items-center gap-1 text-[10px] text-[#555555]">
          <Clock size={10} />
          {post.readingTimeMinutes} min
        </span>
      </div>
    </Link>
  );
}
