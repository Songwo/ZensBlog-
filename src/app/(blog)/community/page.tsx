import Link from "next/link";
import { prisma } from "@/lib/db";
import type { Metadata } from "next";
import { AuthorMini } from "@/components/blog/AuthorMini";

export const metadata: Metadata = {
  title: "社区",
  description: "ZEN::LAB 开发者社区动态流",
};

type SortKey = "latest" | "hottest" | "most-liked";

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q || "").trim();
  const sort = (params.sort || "latest") as SortKey;

  const where = {
    published: true,
    status: "PUBLISHED" as const,
    hiddenByReports: false,
    type: "COMMUNITY" as const,
    ...(q
      ? {
          OR: [{ title: { contains: q } }, { excerpt: { contains: q } }, { content: { contains: q } }],
        }
      : {}),
  };

  const orderBy =
    sort === "most-liked"
      ? [{ likes: { _count: "desc" as const } }, { createdAt: "desc" as const }]
      : [{ createdAt: "desc" as const }];

  const rawPosts = await prisma.post.findMany({
    where,
    include: {
      author: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
          title: true,
          activeBadge: { select: { id: true, name: true, icon: true, iconUrl: true, color: true } },
        },
      },
      _count: { select: { comments: true, likes: true } },
    },
    orderBy,
    take: 50,
  });

  const posts =
    sort === "hottest"
      ? [...rawPosts].sort((a, b) => {
          const aScore = a.views + a._count.likes * 3 + a._count.comments * 2;
          const bScore = b.views + b._count.likes * 3 + b._count.comments * 2;
          return bScore - aScore;
        })
      : rawPosts;

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 py-12 sm:px-8 fade-in-up">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#111111]">社区</h1>
          <p className="mt-1 text-sm text-[#64748b]">面向开发者的讨论与经验分享。</p>
        </div>
        <Link href="/community/new" className="rounded-md bg-accent px-3.5 py-2 text-sm text-white">
          发布帖子
        </Link>
      </div>

      <form className="mb-4 grid gap-3 rounded-xl border border-[#e5e7eb] bg-white/70 p-3 sm:grid-cols-[1fr_auto_auto]">
        <input name="q" defaultValue={q} placeholder="按标题/内容筛选社区帖子" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
        <select name="sort" defaultValue={sort} className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm">
          <option value="latest">最新</option>
          <option value="hottest">最热</option>
          <option value="most-liked">点赞最多</option>
        </select>
        <button type="submit" className="rounded-lg bg-accent px-4 py-2.5 text-sm text-white hover:opacity-90">
          筛选
        </button>
      </form>

      <div className="divide-y divide-[#e9edf4] rounded-xl border border-[#eceff5] bg-white/70">
        {posts.map((post) => (
          <article key={post.id} className="p-4 transition-colors hover:bg-white/90 sm:p-5">
            <Link href={`/community/${post.slug}`} className="block">
              <h2 className="text-lg font-semibold text-[#111111]">{post.title}</h2>
              <p className="mt-1 line-clamp-2 text-sm text-[#64748b]">{post.excerpt || post.content.slice(0, 120)}</p>
            </Link>
            <div className="mt-3 flex items-center gap-3 text-xs text-[#94a3b8]">
              <AuthorMini
                name={post.author?.name || "社区用户"}
                username={post.author?.username || null}
                image={post.author?.image || null}
                title={post.author?.title || null}
                badge={post.author?.activeBadge || null}
                enablePreview
              />
              <span>{new Date(post.createdAt).toLocaleString("zh-CN")}</span>
              <span>{post._count.comments} 评论</span>
              <span>{post._count.likes} 点赞</span>
            </div>
          </article>
        ))}
        {posts.length === 0 && <p className="p-8 text-center text-sm text-[#64748b]">还没有社区帖子，欢迎发布第一篇。</p>}
      </div>
    </div>
  );
}
