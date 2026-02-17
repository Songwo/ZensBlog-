import Link from "next/link";
import { prisma } from "@/lib/db";
import type { Metadata } from "next";
import { AuthorMini } from "@/components/blog/AuthorMini";

export const metadata: Metadata = {
  title: "社区",
  description: "ZEN::LAB 开发者社区动态流",
};

export default async function CommunityPage() {
  const posts = await prisma.post.findMany({
    where: { published: true, type: "COMMUNITY" },
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
      _count: { select: { comments: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 sm:px-8 py-12 fade-in-up">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#111111]">社区</h1>
          <p className="text-sm text-[#64748b] mt-1">面向开发者的讨论与经验分享。</p>
        </div>
        <Link href="/community/new" className="rounded-md bg-accent px-3.5 py-2 text-sm text-white">
          发布帖子
        </Link>
      </div>

      <div className="divide-y divide-[#e9edf4] rounded-xl border border-[#eceff5] bg-white/70">
        {posts.map((post) => (
          <article key={post.id} className="p-4 sm:p-5 hover:bg-white/90 transition-colors">
            <Link href={`/community/${post.slug}`} className="block">
              <h2 className="text-lg font-semibold text-[#111111]">{post.title}</h2>
              <p className="mt-1 text-sm text-[#64748b] line-clamp-2">{post.excerpt || post.content.slice(0, 120)}</p>
              <div className="mt-3 flex items-center gap-3 text-xs text-[#94a3b8]">
                <AuthorMini
                  name={post.author?.name || "社区用户"}
                  username={post.author?.username || null}
                  image={post.author?.image || null}
                  title={post.author?.title || null}
                  badge={post.author?.activeBadge || null}
                />
                <span>{new Date(post.createdAt).toLocaleString("zh-CN")}</span>
                <span>{post._count.comments} 评论</span>
              </div>
            </Link>
          </article>
        ))}
        {posts.length === 0 && <p className="p-8 text-center text-sm text-[#64748b]">还没有社区帖子，欢迎发布第一篇。</p>}
      </div>
    </div>
  );
}
