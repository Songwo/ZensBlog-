"use client";

import { useMemo, useState } from "react";

type Props = {
  toast: (type: "success" | "error", message: string) => void;
};

function pwdScore(value: string) {
  let score = 0;
  if (value.length >= 8) score += 1;
  if (/[A-Z]/.test(value)) score += 1;
  if (/[a-z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;
  return score;
}

export default function AccountSection({ toast }: Props) {
  const [showPwd, setShowPwd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const score = useMemo(() => pwdScore(form.newPassword), [form.newPassword]);
  const strength = ["很弱", "较弱", "中等", "较强", "强", "很强"][score];

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/me/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await res.json();
      if (!res.ok) {
        toast("error", payload.error || "修改失败");
        return;
      }
      setForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      toast("success", "密码已更新");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[#eceff5] bg-white/80 p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">账号与密码</h3>
      <p className="mt-1 text-xs text-slate-500">修改密码后，请妥善保存并避免在弱网络环境公开输入。</p>

      <div className="mt-4 space-y-3">
        <input type={showPwd ? "text" : "password"} value={form.oldPassword} onChange={(e) => setForm((v) => ({ ...v, oldPassword: e.target.value }))} placeholder="旧密码" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
        <input type={showPwd ? "text" : "password"} value={form.newPassword} onChange={(e) => setForm((v) => ({ ...v, newPassword: e.target.value }))} placeholder="新密码" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
        <input type={showPwd ? "text" : "password"} value={form.confirmPassword} onChange={(e) => setForm((v) => ({ ...v, confirmPassword: e.target.value }))} placeholder="确认新密码" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
      </div>
      <p className="mt-2 text-xs text-slate-600">强度：{strength}</p>
      <div className="mt-3 flex items-center gap-3">
        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={showPwd} onChange={(e) => setShowPwd(e.target.checked)} />
          显示密码
        </label>
        <button onClick={save} disabled={saving} className="rounded-lg bg-accent px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50">
          {saving ? "提交中..." : "更新密码"}
        </button>
      </div>
    </div>
  );
}
