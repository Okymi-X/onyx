import type { BlogPost } from '@/types/blog';
import PostCard from './PostCard';

interface Props {
  currentPost: BlogPost;
  allPosts: BlogPost[];
}

export default function RelatedPosts({ currentPost, allPosts }: Props) {
  const others = allPosts.filter((p) => p.slug !== currentPost.slug);

  // Posts with tag overlap, sorted by overlap count
  const withScore = others.map((p) => ({
    post: p,
    score: p.tags.filter((t) => currentPost.tags.includes(t)).length,
  }));

  withScore.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    // fallback: same type
    const aType = a.post.type === currentPost.type ? 1 : 0;
    const bType = b.post.type === currentPost.type ? 1 : 0;
    return bType - aType;
  });

  const related = withScore.slice(0, 3).map((x) => x.post);

  if (related.length === 0) return null;

  return (
    <section className="mt-16 border-t border-[#2e2e2e] pt-10">
      <h2 className="mb-6 text-lg font-semibold text-white">Related</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {related.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </section>
  );
}
