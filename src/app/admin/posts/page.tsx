import { prisma } from "@/lib/db";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { PostActions } from "@/components/admin/PostActions";

export default async function AdminPostsPage() {
  const posts = await prisma.post.findMany({
    where: { type: "OFFICIAL" },
    include: { category: true, _count: { select: { comments: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">文章管理</h1>
        <Link
          href="/admin/posts/new"
          className="px-4 py-2 bg-accent text-white text-sm rounded-lg hover:opacity-90 transition-opacity"
        >
          新建文章
        </Link>
      </div>
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-secondary">
              <th className="text-left px-4 py-3 font-medium">标题</th>
              <th className="text-left px-4 py-3 font-medium w-24">分类</th>
              <th className="text-left px-4 py-3 font-medium w-20">状态</th>
              <th className="text-left px-4 py-3 font-medium w-20">阅读</th>
              <th className="text-left px-4 py-3 font-medium w-28">日期</th>
              <th className="text-right px-4 py-3 font-medium w-24">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {posts.map((post) => (
              <tr key={post.id} className="hover:bg-bg-secondary/50 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/admin/posts/${post.id}/edit`} className="hover:text-accent transition-colors">
                    {post.title}
                  </Link>
                  {post.pinned && <span className="ml-2 text-xs text-accent">置顶</span>}
                </td>
                <td className="px-4 py-3 text-text-secondary">{post.category?.name || "-"}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${post.published ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {post.published ? "已发布" : "草稿"}
                  </span>
                </td>
                <td className="px-4 py-3 text-text-secondary">{post.views}</td>
                <td className="px-4 py-3 text-text-secondary text-xs">{formatDate(post.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  <PostActions postId={post.id} postSlug={post.slug} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {posts.length === 0 && (
          <p className="text-center text-text-secondary py-8">暂无文章</p>
        )}
      </div>
    </div>
  );
}
