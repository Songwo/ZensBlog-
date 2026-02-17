"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export function PostActions({ postId, postSlug }: { postId: string; postSlug: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("确定要删除这篇文章吗？")) return;
    const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <Link
        href={`/blog/${postSlug}`}
        target="_blank"
        className="text-xs text-text-secondary hover:text-accent transition-colors"
      >
        查看
      </Link>
      <Link
        href={`/admin/posts/${postId}/edit`}
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
