"use client";

import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";

interface Comment {
  id: string;
  content: string;
  author: string;
  email: string;
  approved: boolean;
  createdAt: Date;
  post: { title: string; slug: string };
}

export function CommentQueue({ comments }: { comments: Comment[] }) {
  const router = useRouter();

  async function handleApprove(id: string) {
    await fetch(`/api/comments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved: true }),
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
      {comments.map((comment) => (
        <div key={comment.id} className="border border-border rounded-lg p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium">{comment.author}</span>
                {comment.email && <span className="text-xs text-text-secondary">{comment.email}</span>}
                <span className={`text-xs px-2 py-0.5 rounded-full ${comment.approved ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                  {comment.approved ? "已通过" : "待审核"}
                </span>
              </div>
              <p className="text-sm text-text mb-2">{comment.content}</p>
              <p className="text-xs text-text-secondary">
                评论于 <span className="font-medium">{comment.post.title}</span> · {formatDate(comment.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {!comment.approved && (
                <button
                  onClick={() => handleApprove(comment.id)}
                  className="text-xs px-3 py-1.5 bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-colors"
                >
                  通过
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
    </div>
  );
}
