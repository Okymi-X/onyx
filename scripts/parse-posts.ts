/**
 * parse-posts.ts
 *
 * Build-time script that reads Markdown files from data/posts/,
 * extracts YAML frontmatter, computes metadata, and outputs
 * src/data/posts-db.json consumed by the Onyx blog frontend.
 *
 * Run: npm run parse:posts
 * Also runs automatically via predev / prebuild hooks.
 */

import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';
import type { BlogPost, PostType, PostsDatabase } from '../src/types/blog';

const POSTS_DIR = path.resolve(__dirname, '..', 'data', 'posts');
const OUTPUT_PATH = path.resolve(__dirname, '..', 'src', 'data', 'posts-db.json');

const TYPE_DIRS: Record<string, PostType> = {
  articles: 'article',
  writeups: 'writeup',
  notes: 'note',
};

function slugify(filePath: string): string {
  return path.basename(filePath, '.md')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-');
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function parsePostFile(filePath: string, defaultType: PostType): BlogPost | null {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);

  if (data.published === false) return null;

  const type: PostType = (data.type as PostType) ?? defaultType;
  const slug = slugify(filePath);
  const wordCount = countWords(content);
  const readingTimeMinutes = Math.max(1, Math.round(wordCount / 200));

  return {
    slug,
    title: data.title ?? slug,
    date: data.date ?? new Date().toISOString().slice(0, 10),
    type,
    tags: Array.isArray(data.tags) ? data.tags : [],
    summary: data.summary ?? '',
    body: content,
    wordCount,
    readingTimeMinutes,
    ...(data.difficulty ? { difficulty: data.difficulty } : {}),
    ...(data.platform ? { platform: data.platform } : {}),
    ...(data.coverImage ? { coverImage: data.coverImage } : {}),
  };
}

function main(): void {
  console.log(`[posts] Reading from: ${POSTS_DIR}`);

  const posts: BlogPost[] = [];

  for (const [dirName, type] of Object.entries(TYPE_DIRS)) {
    const dir = path.join(POSTS_DIR, dirName);
    if (!fs.existsSync(dir)) {
      console.log(`[posts] Skipping missing dir: ${dirName}`);
      continue;
    }
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
    for (const file of files) {
      const post = parsePostFile(path.join(dir, file), type);
      if (post) {
        posts.push(post);
        console.log(`  -> [${post.type}] ${post.slug}`);
      }
    }
  }

  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const db: PostsDatabase = {
    generatedAt: new Date().toISOString(),
    postCount: posts.length,
    posts,
  };

  const outputDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(db, null, 2), 'utf-8');
  console.log(`[posts] Wrote ${posts.length} posts → ${OUTPUT_PATH}`);
}

main();
