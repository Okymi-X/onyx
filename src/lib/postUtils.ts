import type { TocEntry, PostType, PostTypeTheme } from '@/types/blog';

export const POST_TYPE_THEMES: Record<PostType, PostTypeTheme> = {
  article:  { label: 'Article',   color: '#4EC9B0', bgColor: 'rgba(78,201,176,0.15)' },
  writeup:  { label: 'Write-up',  color: '#7D7AF7', bgColor: 'rgba(125,122,247,0.15)' },
  note:     { label: 'Note',      color: '#D7BA7D', bgColor: 'rgba(215,186,125,0.15)' },
};

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function extractToc(body: string): TocEntry[] {
  const entries: TocEntry[] = [];
  for (const line of body.split('\n')) {
    const h2 = line.match(/^## (.+)/);
    const h3 = line.match(/^### (.+)/);
    if (h2) {
      entries.push({ level: 2, text: h2[1].trim(), id: slugifyHeading(h2[1].trim()) });
    } else if (h3) {
      entries.push({ level: 3, text: h3[1].trim(), id: slugifyHeading(h3[1].trim()) });
    }
  }
  return entries;
}

export function formatPostDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const DIFFICULTY_COLORS: Record<string, string> = {
  easy:   '#4EC9B0',
  medium: '#D7BA7D',
  hard:   '#F44747',
  insane: '#9B99FF',
};

export function getDifficultyColor(difficulty: string): string {
  return DIFFICULTY_COLORS[difficulty.toLowerCase()] ?? '#9E9E9E';
}
