"use client";

import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";

interface Comment {
  id: string;
  content: string;
  author: string;
  email: string;
  approved: boolean;
  status: "PENDING" | "APPROVED" | "REJECTED" | "SPAM";
  createdAt: Date;
  post: { title: string; slug: string };
  _count: { likes: number; reports: number };
}

export function CommentQueue({
  comments,
  status,
  q,
  page,
  totalPages,
}: {
  comments: Comment[];
  status: string;
  q: string;
  page: number;
  totalPages: number;
}) {
  const router = useRouter();

  async function handleUpdate(id: string, nextStatus: "APPROVED" | "REJECTED" | "SPAM" | "PENDING") {
    await fetch(`/api/comments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("确定要删除这条评论吗？")) return;
    await fetch(`/api/comments/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <form className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-3">
        <select name="status" defaultValue={status} className="rounded-md border border-border px-2 py-1 text-sm">
          <option value="PENDING">待审核</option>
          <option value="APPROVED">已通过</option>
          <option value="REJECTED">已拒绝</option>
          <option value="SPAM">垃圾</option>
        </select>
        <input name="q" defaultValue={q} placeholder="搜索内容/作者/文章" className="rounded-md border border-border px-2 py-1 text-sm min-w-56" />
        <button className="rounded-md border border-border px-2 py-1 text-sm">筛选</button>
      </form>

      {comments.map((comment) => (
        <div key={comment.id} className="border border-border rounded-lg p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium">{comment.author}</span>
                {comment.email && <span className="text-xs text-text-secondary">{comment.email}</span>}
                <span className={`text-xs px-2 py-0.5 rounded-full ${comment.status === "APPROVED" ? "bg-green-100 text-green-700" : comment.status === "PENDING" ? "bg-yellow-100 text-yellow-700" : "bg-slate-100 text-slate-700"}`}>
                  {comment.status}
                </span>
              </div>
              <p className="text-sm text-text mb-2">{comment.content}</p>
              <p className="text-xs text-text-secondary">
                评论于 <span className="font-medium">{comment.post.title}</span> · {formatDate(comment.createdAt)}
              </p>
              <p className="text-xs text-text-secondary mt-1">
                点赞 {comment._count.likes} · OPEN 举报 {comment._count.reports}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {comment.status !== "APPROVED" && (
                <button
                  onClick={() => handleUpdate(comment.id, "APPROVED")}
                  className="text-xs px-3 py-1.5 bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-colors"
                >
                  通过
                </button>
              )}
              {comment.status !== "REJECTED" && (
                <button
                  onClick={() => handleUpdate(comment.id, "REJECTED")}
                  className="text-xs px-3 py-1.5 bg-amber-50 text-amber-700 rounded-md hover:bg-amber-100 transition-colors"
                >
                  拒绝
                </button>
              )}
              {comment.status !== "SPAM" && (
                <button
                  onClick={() => handleUpdate(comment.id, "SPAM")}
                  className="text-xs px-3 py-1.5 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors"
                >
                  标记垃圾
                </button>
              )}
              <button
                onClick={() => handleDelete(comment.id)}
                className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      ))}
      {comments.length === 0 && (
        <p className="text-center text-text-secondary py-8">暂无评论</p>
      )}
      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => router.push(`/admin/comments?status=${encodeURIComponent(status)}&q=${encodeURIComponent(q)}&page=${page - 1}`)}
          className="rounded-md border border-border px-3 py-1 disabled:opacity-50"
        >
          上一页
        </button>
        <span>{page} / {totalPages}</span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => router.push(`/admin/comments?status=${encodeURIComponent(status)}&q=${encodeURIComponent(q)}&page=${page + 1}`)}
          className="rounded-md border border-border px-3 py-1 disabled:opacity-50"
        >
          下一页
        </button>
      </div>
    </div>
  );
}
