import { prisma } from "@/lib/db";
import Link from "next/link";
import { FriendActions } from "@/components/admin/FriendActions";

export default async function AdminFriendsPage() {
  const friends = await prisma.friendLink.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">友链管理</h1>
        <Link
          href="/admin/friends/new"
          className="px-4 py-2 bg-accent text-white text-sm rounded-lg hover:opacity-90 transition-opacity"
        >
          新建友链
        </Link>
      </div>
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-secondary">
              <th className="text-left px-4 py-3 font-medium">站点</th>
              <th className="text-left px-4 py-3 font-medium">链接</th>
              <th className="text-left px-4 py-3 font-medium w-20">精选</th>
              <th className="text-left px-4 py-3 font-medium w-20">排序</th>
              <th className="text-right px-4 py-3 font-medium w-24">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {friends.map((friend) => (
              <tr key={friend.id} className="hover:bg-bg-secondary/50 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/admin/friends/${friend.id}/edit`} className="hover:text-accent transition-colors">
                    {friend.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-text-secondary truncate max-w-[260px]">{friend.url}</td>
                <td className="px-4 py-3 text-text-secondary">{friend.featured ? "是" : "否"}</td>
                <td className="px-4 py-3 text-text-secondary">{friend.sortOrder}</td>
                <td className="px-4 py-3 text-right">
                  <FriendActions friendId={friend.id} friendUrl={friend.url} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {friends.length === 0 && (
          <p className="text-center text-text-secondary py-8">暂无友链</p>
        )}
      </div>
    </div>
  );
}
