"use client";

import { useRouter } from "next/navigation";

interface Subscriber {
  email: string;
  createdAt: string;
  source: string;
}

export function NewsletterTable({ subscribers }: { subscribers: Subscriber[] }) {
  const router = useRouter();

  async function remove(email: string) {
    if (!confirm(`确认删除订阅：${email}？`)) return;
    const res = await fetch("/api/newsletter", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (res.ok) router.refresh();
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-bg-secondary">
            <th className="text-left px-4 py-3 font-medium">邮箱</th>
            <th className="text-left px-4 py-3 font-medium w-44">来源</th>
            <th className="text-left px-4 py-3 font-medium w-44">订阅时间</th>
            <th className="text-right px-4 py-3 font-medium w-24">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {subscribers.map((row) => (
            <tr key={row.email}>
              <td className="px-4 py-3">{row.email}</td>
              <td className="px-4 py-3 text-text-secondary">{row.source || "site"}</td>
              <td className="px-4 py-3 text-text-secondary">{new Date(row.createdAt).toLocaleString("zh-CN")}</td>
              <td className="px-4 py-3 text-right">
                <button onClick={() => remove(row.email)} className="text-xs text-red-500">删除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {subscribers.length === 0 && <p className="text-center py-8 text-text-secondary">暂无订阅用户</p>}
    </div>
  );
}

