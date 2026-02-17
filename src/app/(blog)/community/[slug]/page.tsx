import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import type { Metadata } from "next";
import { AuthorCard } from "@/components/blog/AuthorCard";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.post.findFirst({
    where: { slug, type: "COMMUNITY", published: true },
    select: { title: true, excerpt: true },
  });
  if (!post) return {};
  return { title: `${post.title} - 社区`, description: post.excerpt };
}

export default async function CommunityDetailPage({ params }: Props) {
  const { slug } = await params;
  const post = await prisma.post.findFirst({
    where: { slug, type: "COMMUNITY", published: true },
    include: {
      author: {
        select: {
          name: true,
          username: true,
          image: true,
          title: true,
          activeBadge: { select: { id: true, name: true, icon: true, iconUrl: true, color: true } },
        },
      },
      comments: {
        where: { approved: true, parentId: null },
        include: { replies: { where: { approved: true }, orderBy: { createdAt: "asc" } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!post) notFound();

  return (
    <div className="mx-auto w-full max-w-[980px] px-4 sm:px-8 py-12 fade-in-up">
      <h1 className="text-3xl font-bold text-[#111111]">{post.title}</h1>
      <div className="mt-3 text-sm text-[#64748b]">
        <AuthorCard
          name={post.author?.name || "社区用户"}
          username={post.author?.username || null}
          image={post.author?.image || null}
          title={post.author?.title || null}
          badge={post.author?.activeBadge || null}
          variant="compact"
        />
        <p className="mt-2">{formatDate(post.publishedAt || post.createdAt)}</p>
      </div>
      {post.excerpt && <p className="mt-4 text-[#64748b]">{post.excerpt}</p>}
      <article className="mt-8 rounded-xl border border-[#eceff5] bg-white/70 p-6 whitespace-pre-wrap leading-8 text-[#334155]">
        {post.content}
      </article>
    </div>
  );
}
