"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export function FriendActions({ friendId, friendUrl }: { friendId: string; friendUrl: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("确定要删除这个友链吗？")) return;
    const res = await fetch(`/api/friends/${friendId}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <a
        href={friendUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-text-secondary hover:text-accent transition-colors"
      >
        查看
      </a>
      <Link
        href={`/admin/friends/${friendId}/edit`}
        className="text-xs text-text-secondary hover:text-accent transition-colors"
      >
        编辑
      </Link>
      <button
        onClick={handleDelete}
        className="text-xs text-text-secondary hover:text-red-500 transition-colors"
      >
        删除
      </button>
    </div>
  );
}
