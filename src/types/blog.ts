export type PostType = 'article' | 'writeup' | 'note';

export type Difficulty = 'easy' | 'medium' | 'hard' | 'insane';

export interface PostTypeTheme {
  label: string;
  color: string;
  bgColor: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  type: PostType;
  tags: string[];
  summary: string;
  body: string;
  wordCount: number;
  readingTimeMinutes: number;
  difficulty?: Difficulty;
  platform?: string;
  coverImage?: string;
}

export interface PostsDatabase {
  generatedAt: string;
  postCount: number;
  posts: BlogPost[];
}

export interface TocEntry {
  id: string;
  text: string;
  level: 2 | 3;
}
