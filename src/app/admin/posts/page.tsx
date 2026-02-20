import { prisma } from "@/lib/db";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { PostActions } from "@/components/admin/PostActions";

type SortKey = "latest" | "hottest" | "most-liked";

const SORT_OPTIONS: Array<{ key: SortKey; label: string }> = [
  { key: "latest", label: "最新" },
  { key: "hottest", label: "最热" },
  { key: "most-liked", label: "点赞最多" },
];

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; q?: string }>;
}) {
  const params = await searchParams;
  const sort = (params.sort || "latest") as SortKey;
  const q = (params.q || "").trim();

  const where = {
    type: "OFFICIAL" as const,
    ...(q ? { title: { contains: q } } : {}),
  };

  const orderBy =
    sort === "most-liked"
      ? [{ likes: { _count: "desc" as const } }, { createdAt: "desc" as const }]
      : [{ createdAt: "desc" as const }];

  const rawPosts = await prisma.post.findMany({
    where,
    include: { category: true, _count: { select: { comments: true, likes: true } } },
    orderBy,
    take: sort === "hottest" ? 200 : undefined,
  });

  const posts =
    sort === "hottest"
      ? [...rawPosts].sort((a, b) => {
          const scoreA = a.views + a._count.likes * 3 + a._count.comments * 2;
          const scoreB = b.views + b._count.likes * 3 + b._count.comments * 2;
          return scoreB - scoreA;
        })
      : rawPosts;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">文章管理</h1>
        <Link
          href="/admin/posts/new"
          className="rounded-lg bg-accent px-4 py-2 text-sm text-white transition-opacity hover:opacity-90"
        >
          新建文章
        </Link>
      </div>

      <form className="mb-5 grid gap-3 rounded-lg border border-border bg-bg-secondary/40 p-3 sm:grid-cols-[1fr_auto]">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="按标题搜索文章"
          className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <div className="flex items-center gap-2">
          <select
            name="sort"
            defaultValue={sort}
            className="rounded-md border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
          >
            {SORT_OPTIONS.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
          <button type="submit" className="rounded-md bg-accent px-4 py-2 text-sm text-white hover:opacity-90">
            筛选
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-lg border border-border bg-bg">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-secondary">
              <th className="px-4 py-3 text-left font-medium">标题</th>
              <th className="w-24 px-4 py-3 text-left font-medium">分类</th>
              <th className="w-20 px-4 py-3 text-left font-medium">状态</th>
              <th className="w-20 px-4 py-3 text-left font-medium">阅读</th>
              <th className="w-20 px-4 py-3 text-left font-medium">点赞</th>
              <th className="w-20 px-4 py-3 text-left font-medium">评论</th>
              <th className="w-28 px-4 py-3 text-left font-medium">日期</th>
              <th className="w-24 px-4 py-3 text-right font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {posts.map((post) => (
              <tr key={post.id} className="transition-colors hover:bg-bg-secondary/50">
                <td className="px-4 py-3">
                  <Link href={`/admin/posts/${post.id}/edit`} className="transition-colors hover:text-accent">
                    {post.title}
                  </Link>
                  {post.pinned && <span className="ml-2 text-xs text-accent">置顶</span>}
                </td>
                <td className="px-4 py-3 text-text-secondary">{post.category?.name || "-"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${post.published ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}
                  >
                    {post.published ? "已发布" : "草稿"}
                  </span>
                </td>
                <td className="px-4 py-3 text-text-secondary">{post.views}</td>
                <td className="px-4 py-3 text-text-secondary">{post._count.likes}</td>
                <td className="px-4 py-3 text-text-secondary">{post._count.comments}</td>
                <td className="px-4 py-3 text-xs text-text-secondary">{formatDate(post.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  <PostActions postId={post.id} postSlug={post.slug} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {posts.length === 0 && <p className="py-8 text-center text-text-secondary">暂无文章</p>}
      </div>
    </div>
  );
}
