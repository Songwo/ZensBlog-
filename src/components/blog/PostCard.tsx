import Link from "next/link";
import Image from "next/image";
import { DeployChip } from "@/components/blog/DeployChip";
import { BrandCoverPlaceholder } from "@/components/blog/BrandCoverPlaceholder";
import { calculateReadingTime, formatDate, formatReadingTime } from "@/lib/utils";

interface PostCardProps {
  post: {
    title: string;
    slug: string;
    excerpt: string;
    coverImage: string;
    publishedAt: Date | null;
    views: number;
    _count: { likes: number; comments: number };
    category: { name: string; slug: string } | null;
    tags: { tag: { name: string; slug: string } }[];
  };
  featured?: boolean;
}

export function PostCard({ post, featured }: PostCardProps) {
  const readingTime = formatReadingTime(calculateReadingTime(post.excerpt));
  const heat = Math.round(post.views * 1 + post._count.likes * 3 + post._count.comments * 2);

  return (
    <article className={`group ${featured ? "col-span-full" : ""}`}>
      <div className={`post-card-v2 post-card-layout ${featured ? "post-card-featured" : ""}`}>
        <Link href={`/blog/${post.slug}`} className="block shock-link flex-1">
          <div className={`relative overflow-hidden rounded-lg mb-4 ${featured ? "aspect-[2/1]" : "aspect-[3/2]"}`}>
            {post.coverImage ? (
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                className="object-cover post-card-image"
                sizes={featured ? "100vw" : "(max-width: 768px) 100vw, 50vw"}
              />
            ) : (
              <BrandCoverPlaceholder seed={post.slug} compact />
            )}
          </div>

          <div className="space-y-2 post-card-content">
            <div className="flex items-center gap-3 text-xs text-[#6b7280]">
              {post.category && (
                <span className="text-[#2f3442] font-medium">{post.category.name}</span>
              )}
              <time>{formatDate(post.publishedAt)}</time>
              <span>预计 {readingTime}</span>
            </div>
            <h2 className={`font-heading font-bold text-[#151515] transition-colors ${featured ? "text-2xl sm:text-3xl" : "text-lg sm:text-xl"}`}>
              {post.title}
            </h2>
            <p className="text-[#555d6f] text-sm line-clamp-3">{post.excerpt}</p>
            <div className="flex items-center gap-3 text-xs text-[#64748b]">
              <span>👁 {post.views}</span>
              <span>👍 {post._count.likes}</span>
              <span>💬 {post._count.comments}</span>
              <span className="rounded-full bg-rose-50 px-2 py-0.5 text-rose-600">热度 {heat}</span>
            </div>
          </div>
        </Link>
        <DeployChip slug={post.slug} />
      </div>
    </article>
  );
}
