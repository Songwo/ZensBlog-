"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Subscriber {
  email: string;
  createdAt: string;
  source: string;
}

interface NotifySettings {
  feishuWebhook: string;
  wecomWebhook: string;
  emailEnabled: boolean;
  emailTo: string;
}

export function NewsletterTable({
  subscribers,
  notifySettings,
}: {
  subscribers: Subscriber[];
  notifySettings: NotifySettings;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(notifySettings);

  async function remove(email: string) {
    if (!confirm(`确认删除订阅：${email}？`)) return;
    const res = await fetch("/api/newsletter", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (res.ok) router.refresh();
  }

  async function saveNotifySettings(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        alert(data.error || "保存失败");
        return;
      }
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={saveNotifySettings} className="rounded-lg border border-border bg-bg-secondary/40 p-4">
        <h2 className="mb-3 text-base font-semibold">通知推送配置</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block text-text-secondary">飞书机器人 Webhook</span>
            <input
              type="url"
              value={form.feishuWebhook}
              onChange={(e) => setForm((prev) => ({ ...prev, feishuWebhook: e.target.value }))}
              placeholder="https://open.feishu.cn/open-apis/bot/v2/hook/..."
              className="w-full rounded-md border border-border bg-bg px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-text-secondary">企业微信机器人 Webhook</span>
            <input
              type="url"
              value={form.wecomWebhook}
              onChange={(e) => setForm((prev) => ({ ...prev, wecomWebhook: e.target.value }))}
              placeholder="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=..."
              className="w-full rounded-md border border-border bg-bg px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-text-secondary">通知邮箱</span>
            <input
              type="email"
              value={form.emailTo}
              onChange={(e) => setForm((prev) => ({ ...prev, emailTo: e.target.value }))}
              placeholder="owner@example.com"
              className="w-full rounded-md border border-border bg-bg px-3 py-2"
            />
          </label>
          <label className="mt-6 inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.emailEnabled}
              onChange={(e) => setForm((prev) => ({ ...prev, emailEnabled: e.target.checked }))}
              className="h-4 w-4"
            />
            启用邮件通知（需配置 RESEND_API_KEY）
          </label>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="mt-4 rounded-md bg-accent px-4 py-2 text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "保存中..." : "保存推送配置"}
        </button>
      </form>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-secondary">
              <th className="px-4 py-3 text-left font-medium">邮箱</th>
              <th className="w-44 px-4 py-3 text-left font-medium">来源</th>
              <th className="w-44 px-4 py-3 text-left font-medium">订阅时间</th>
              <th className="w-24 px-4 py-3 text-right font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {subscribers.map((row) => (
              <tr key={row.email}>
                <td className="px-4 py-3">{row.email}</td>
                <td className="px-4 py-3 text-text-secondary">{row.source || "site"}</td>
                <td className="px-4 py-3 text-text-secondary">{new Date(row.createdAt).toLocaleString("zh-CN")}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => remove(row.email)} className="text-xs text-red-500">
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {subscribers.length === 0 && <p className="py-8 text-center text-text-secondary">暂无订阅用户</p>}
      </div>
    </div>
  );
}
