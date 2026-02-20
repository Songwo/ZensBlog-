import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import type { Metadata } from "next";
import { AuthorCard } from "@/components/blog/AuthorCard";
import { renderMarkdown } from "@/lib/markdown";
import { MarkdownEnhancer } from "@/components/blog/MarkdownEnhancer";
import { markdownToHtml } from "@/lib/client-markdown";
import { LinkCardEnhancer } from "@/components/blog/LinkCardEnhancer";

interface Props {
  params: Promise<{ slug: string }>;
}

function buildSlugCandidates(slug: string) {
  const candidates = new Set<string>([slug]);
  try {
    const decoded = decodeURIComponent(slug);
    if (decoded) candidates.add(decoded);
  } catch {
    // ignore invalid URI sequence
  }
  return Array.from(candidates);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const candidates = buildSlugCandidates(slug);
  const post = await prisma.post.findFirst({
    where: { slug: { in: candidates }, published: true, status: "PUBLISHED", hiddenByReports: false },
    select: { title: true, excerpt: true },
  });
  if (!post) return {};
  return { title: `${post.title} - 社区`, description: post.excerpt };
}

export default async function CommunityDetailPage({ params }: Props) {
  const { slug } = await params;
  const candidates = buildSlugCandidates(slug);
  const post = await prisma.post.findFirst({
    where: { slug: { in: candidates }, published: true, status: "PUBLISHED", hiddenByReports: false },
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
        where: { status: "APPROVED", hiddenByReports: false, parentId: null },
        include: { replies: { where: { status: "APPROVED", hiddenByReports: false }, orderBy: { createdAt: "asc" } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!post) notFound();
  if (post.type === "OFFICIAL") {
    redirect(`/blog/${post.slug}`);
  }
  const content = await renderMarkdown(post.content).catch((error) => {
    console.error("[Community Post Render Error]", { slug: post.slug, error });
    return (
      <article
        className="max-w-none"
        dangerouslySetInnerHTML={{ __html: markdownToHtml(post.content) }}
      />
    );
  });

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
      <article id="community-post-content" className="prose prose-base mt-8 max-w-none rounded-xl border border-[#eceff5] bg-white/70 p-6 leading-8 text-[#334155]">
        {content}
      </article>
      <MarkdownEnhancer containerId="community-post-content" />
      <LinkCardEnhancer containerId="community-post-content" />
    </div>
  );
}
