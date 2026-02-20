import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function AdminDashboard() {
  const [postCount, publishedCount, commentCount, pendingComments, recentPosts] = await Promise.all([
    prisma.post.count({ where: { type: "OFFICIAL" } }),
    prisma.post.count({ where: { published: true, status: "PUBLISHED", type: "OFFICIAL" } }),
    prisma.comment.count(),
    prisma.comment.count({ where: { status: "PENDING" } }),
    prisma.post.findMany({
      where: { type: "OFFICIAL" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, title: true, slug: true, published: true, views: true, createdAt: true },
    }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">仪表盘</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="总文章" value={postCount} />
        <StatCard label="已发布" value={publishedCount} />
        <StatCard label="总评论" value={commentCount} />
        <StatCard label="待审核" value={pendingComments} accent />
      </div>

      {/* Recent Posts */}
      <div className="border border-border rounded-lg">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="font-medium">最近文章</h2>
          <Link href="/admin/posts/new" className="text-sm text-accent hover:underline">
            新建文章
          </Link>
        </div>
        <div className="divide-y divide-border">
          {recentPosts.map((post) => (
            <div key={post.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <Link href={`/admin/posts/${post.id}/edit`} className="text-sm font-medium hover:text-accent transition-colors">
                  {post.title}
                </Link>
                <p className="text-xs text-text-secondary mt-0.5">
                  {post.published ? "已发布" : "草稿"} · {post.views} 次阅读
                </p>
              </div>
              <Link
                href={`/admin/posts/${post.id}/edit`}
                className="text-xs text-text-secondary hover:text-accent transition-colors"
              >
                编辑
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="border border-border rounded-lg p-4">
      <p className="text-sm text-text-secondary">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${accent ? "text-accent" : ""}`}>{value}</p>
    </div>
  );
}
