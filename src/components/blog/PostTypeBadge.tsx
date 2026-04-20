import type { PostType } from '@/types/blog';
import { POST_TYPE_THEMES } from '@/lib/postUtils';

interface Props {
  type: PostType;
  size?: 'sm' | 'md';
}

export default function PostTypeBadge({ type, size = 'sm' }: Props) {
  const theme = POST_TYPE_THEMES[type];
  if (!theme) return null;

  return (
    <span
      className={`inline-flex items-center rounded font-semibold uppercase tracking-wide ${
        size === 'md' ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-[10px]'
      }`}
      style={{ color: theme.color, backgroundColor: theme.bgColor }}
    >
      {theme.label}
    </span>
  );
}
