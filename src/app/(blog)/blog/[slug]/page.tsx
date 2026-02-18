import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { renderMarkdown, extractTOC } from "@/lib/markdown";
import { PostDetailExperience } from "@/components/blog/PostDetailExperience";
import { calculateReadingTime } from "@/lib/utils";
import { getSiteSettings } from "@/lib/site-config";
import type { Metadata } from "next";

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
  const [post, settings] = await Promise.all([
    prisma.post.findFirst({ where: { slug: { in: candidates }, type: "OFFICIAL" } }),
    getSiteSettings(),
  ]);
  if (!post) return {};

  const baseUrl = settings.siteUrl.replace(/\/+$/, "");
  const ogImage = post.coverImage
    ? (post.coverImage.startsWith("http") ? post.coverImage : `${baseUrl}${post.coverImage}`)
    : `${baseUrl}/blog/${post.slug}/opengraph-image`;

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [ogImage],
    },
  };
}

export default async function PostPage({ params }: Props) {
  const session = await auth();
  const { slug } = await params;
  const candidates = buildSlugCandidates(slug);
  const post = await prisma.post.findFirst({
    where: { slug: { in: candidates }, published: true, type: "OFFICIAL" },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          name: true,
          image: true,
          bio: true,
          title: true,
          activeBadge: { select: { id: true, name: true, icon: true, iconUrl: true, color: true } },
        },
      },
      category: true,
      tags: { include: { tag: true } },
      comments: {
        where: { approved: true, parentId: null },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              image: true,
              title: true,
              activeBadge: { select: { id: true, name: true, icon: true, iconUrl: true, color: true } },
            },
          },
          replies: {
            where: { approved: true },
            orderBy: { createdAt: "asc" },
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  name: true,
                  image: true,
                  title: true,
                  activeBadge: { select: { id: true, name: true, icon: true, iconUrl: true, color: true } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!post) notFound();

  // Increment views
  await prisma.post.update({ where: { id: post.id }, data: { views: { increment: 1 } } });

  const relatedWhere =
    post.tags.length > 0
      ? {
          published: true as const,
          type: "OFFICIAL" as const,
          id: { not: post.id },
          slug: { not: post.slug },
          tags: { some: { tagId: { in: post.tags.map((t) => t.tagId) } } },
        }
      : {
          published: true as const,
          type: "OFFICIAL" as const,
          id: { not: post.id },
          slug: { not: post.slug },
        };

  const [content, authorConfig, prevPost, nextPost, relatedPostsRaw, likeCount, viewerLike] = await Promise.all([
    renderMarkdown(post.content).catch((error) => {
      console.error("[Post Render Error]", { slug: post.slug, error });
      return (
        <article className="prose prose-slate max-w-none">
          <pre className="whitespace-pre-wrap break-words">{post.content}</pre>
        </article>
      );
    }),
    prisma.siteConfig.findUnique({ where: { key: "authorName" } }),
    prisma.post.findFirst({
      where: { published: true, type: "OFFICIAL", publishedAt: { lt: post.publishedAt ?? new Date() } },
      select: { id: true, title: true, slug: true, excerpt: true, coverImage: true },
      orderBy: { publishedAt: "desc" },
    }),
    prisma.post.findFirst({
      where: { published: true, type: "OFFICIAL", publishedAt: { gt: post.publishedAt ?? new Date(0) } },
      select: { id: true, title: true, slug: true, excerpt: true, coverImage: true },
      orderBy: { publishedAt: "asc" },
    }),
    prisma.post.findMany({
      where: relatedWhere,
      select: { id: true, title: true, slug: true, excerpt: true, coverImage: true },
      orderBy: { publishedAt: "desc" },
      take: 6,
    }),
    prisma.postLike.count({ where: { postId: post.id } }),
    session?.user?.id
      ? prisma.postLike.findUnique({
          where: {
            userId_postId: {
              userId: session.user.id,
              postId: post.id,
            },
          },
          select: { id: true },
        })
      : Promise.resolve(null),
  ]);
  const relatedPosts = relatedPostsRaw.map((item) => ({
    ...item,
    excerpt: (item.excerpt || "").replace(/\s+/g, " ").trim().slice(0, 120),
  }));
  const toc = extractTOC(post.content);

  const displayAuthorName = post.author?.name || authorConfig?.value || "Zen";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: { "@type": "Person", name: displayAuthorName },
    ...(post.coverImage ? { image: post.coverImage } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PostDetailExperience
        post={{
          id: post.id,
          slug: post.slug,
          title: post.title,
          excerpt: post.excerpt,
          coverImage: post.coverImage || null,
          publishedAt: post.publishedAt?.toISOString() ?? null,
          views: post.views + 1,
          readingTime: calculateReadingTime(post.content),
          category: post.category ? { name: post.category.name, slug: post.category.slug } : null,
          tags: post.tags.map(({ tag }) => ({ id: tag.id, name: tag.name, slug: tag.slug })),
          comments: post.comments,
          likeCount,
          viewerLiked: Boolean(viewerLike),
        }}
        authorName={displayAuthorName}
        author={{
          id: post.author?.id || "",
          username: post.author?.username || null,
          name: post.author?.name || displayAuthorName,
          image: post.author?.image || null,
          bio: post.author?.bio || null,
          title: post.author?.title || null,
          activeBadge: post.author?.activeBadge || null,
        }}
        toc={toc}
        relatedPosts={relatedPosts}
        prevPost={prevPost}
        nextPost={nextPost}
      >
        {content}
      </PostDetailExperience>
    </>
  );
}
