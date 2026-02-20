"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

interface ReportItem {
  id: string;
  targetType: "POST" | "COMMENT";
  targetId: string;
  reason: string;
  detail: string;
  status: "OPEN" | "RESOLVED" | "IGNORED";
  post?: { id: string; slug: string; title: string } | null;
  comment?: { id: string; content: string; post?: { slug: string } | null } | null;
}

export function ReportQueue({
  items,
  status,
  page,
  totalPages,
}: {
  items: ReportItem[];
  status: string;
  page: number;
  totalPages: number;
}) {
  const router = useRouter();

  async function updateStatus(id: string, next: "OPEN" | "RESOLVED" | "IGNORED") {
    await fetch("/api/reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: next }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">举报管理</h1>
        <div className="flex gap-2 text-sm">
          <Link href="/admin/reports?status=OPEN" className="rounded border border-border px-2 py-1">OPEN</Link>
          <Link href="/admin/reports?status=RESOLVED" className="rounded border border-border px-2 py-1">RESOLVED</Link>
          <Link href="/admin/reports?status=IGNORED" className="rounded border border-border px-2 py-1">IGNORED</Link>
        </div>
      </div>

      {items.map((item) => (
        <div key={item.id} className="rounded-lg border border-border p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">
              {item.targetType} · {item.reason} · {item.status}
            </p>
            <div className="flex gap-2">
              <button onClick={() => void updateStatus(item.id, "RESOLVED")} className="rounded bg-green-50 px-2 py-1 text-xs text-green-700">
                解决
              </button>
              <button onClick={() => void updateStatus(item.id, "IGNORED")} className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">
                忽略
              </button>
            </div>
          </div>
          <p className="mt-1 text-xs text-text-secondary">目标ID: {item.targetId}</p>
          {item.detail && <p className="mt-2 text-sm">{item.detail}</p>}
          {item.post && (
            <Link href={`/blog/${item.post.slug}`} className="mt-2 inline-block text-xs text-accent hover:underline">
              文章：{item.post.title}
            </Link>
          )}
          {item.comment && (
            <p className="mt-2 text-xs text-text-secondary">评论：{item.comment.content.slice(0, 80)}</p>
          )}
        </div>
      ))}

      <div className="flex items-center justify-between text-sm">
        <Link
          href={`/admin/reports?status=${encodeURIComponent(status)}&page=${Math.max(1, page - 1)}`}
          className={`rounded border border-border px-3 py-1 ${page <= 1 ? "pointer-events-none opacity-40" : ""}`}
        >
          上一页
        </Link>
        <span>{page} / {totalPages}</span>
        <Link
          href={`/admin/reports?status=${encodeURIComponent(status)}&page=${Math.min(totalPages, page + 1)}`}
          className={`rounded border border-border px-3 py-1 ${page >= totalPages ? "pointer-events-none opacity-40" : ""}`}
        >
          下一页
        </Link>
      </div>
    </div>
  );
}

