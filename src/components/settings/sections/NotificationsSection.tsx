"use client";

import { useState } from "react";
import type { MeOverview } from "@/components/settings/types";

type Props = {
  data: MeOverview;
  onUpdated: () => Promise<unknown>;
  notifyDirty: (dirty: boolean) => void;
  toast: (type: "success" | "error", message: string) => void;
};

export default function NotificationsSection({ data, onUpdated, notifyDirty, toast }: Props) {
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [form, setForm] = useState({
    inApp: data.settings.preferences.inApp,
    comment: data.settings.preferences.comment,
    like: data.settings.preferences.like,
    reply: data.settings.preferences.reply,
    report: data.settings.preferences.report,
    message: data.settings.preferences.message,
    emailEnabled: data.settings.notify.emailEnabled,
    emailTo: data.settings.notify.emailTo || "",
    feishuWebhook: data.settings.notify.feishuWebhook || "",
    wecomWebhook: data.settings.notify.wecomWebhook || "",
  });

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/me/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await res.json();
      if (!res.ok) {
        toast("error", payload.error || "保存失败");
        return;
      }
      notifyDirty(false);
      toast("success", "通知设置已保存");
      await onUpdated();
    } finally {
      setSaving(false);
    }
  }

  async function sendTest() {
    setTesting(true);
    try {
      const res = await fetch("/api/me/notifications/test", { method: "POST" });
      const payload = await res.json();
      if (!res.ok) {
        toast("error", payload.error || "测试发送失败");
        return;
      }
      toast("success", "测试消息已发送");
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[#eceff5] bg-white/80 p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">推送渠道与通知偏好</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={form.inApp} onChange={(e) => { setForm((v) => ({ ...v, inApp: e.target.checked })); notifyDirty(true); }} />站内通知</label>
        <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={form.comment} onChange={(e) => { setForm((v) => ({ ...v, comment: e.target.checked })); notifyDirty(true); }} />评论通知</label>
        <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={form.like} onChange={(e) => { setForm((v) => ({ ...v, like: e.target.checked })); notifyDirty(true); }} />点赞通知</label>
        <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={form.reply} onChange={(e) => { setForm((v) => ({ ...v, reply: e.target.checked })); notifyDirty(true); }} />被回复通知</label>
        <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={form.report} onChange={(e) => { setForm((v) => ({ ...v, report: e.target.checked })); notifyDirty(true); }} />举报处理通知</label>
        <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={form.message} onChange={(e) => { setForm((v) => ({ ...v, message: e.target.checked })); notifyDirty(true); }} />私信通知</label>
      </div>

      <div className="mt-5 space-y-3">
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.emailEnabled} onChange={(e) => { setForm((v) => ({ ...v, emailEnabled: e.target.checked })); notifyDirty(true); }} />
          启用邮件通知
        </label>
        <input value={form.emailTo} onChange={(e) => { setForm((v) => ({ ...v, emailTo: e.target.value })); notifyDirty(true); }} placeholder="通知邮箱" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
        <input value={form.feishuWebhook} onChange={(e) => { setForm((v) => ({ ...v, feishuWebhook: e.target.value })); notifyDirty(true); }} placeholder="飞书 Webhook（仅自己）" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
        <input value={form.wecomWebhook} onChange={(e) => { setForm((v) => ({ ...v, wecomWebhook: e.target.value })); notifyDirty(true); }} placeholder="企业微信 Webhook（仅自己）" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={save} disabled={saving} className="rounded-lg bg-accent px-4 py-2 text-sm text-white disabled:opacity-50">
          {saving ? "保存中..." : "保存通知设置"}
        </button>
        <button onClick={sendTest} disabled={testing} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 disabled:opacity-50">
          {testing ? "发送中..." : "发送测试消息"}
        </button>
      </div>
    </div>
  );
}
