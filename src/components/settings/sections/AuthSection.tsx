"use client";

import { useState } from "react";
import type { MeOverview } from "@/components/settings/types";

type Props = {
  data: MeOverview;
  onUpdated: () => Promise<unknown>;
  toast: (type: "success" | "error", message: string) => void;
};

export default function AuthSection({ data, onUpdated, toast }: Props) {
  const [busy, setBusy] = useState(false);
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

  async function setup() {
    setBusy(true);
    try {
      const res = await fetch("/api/profile/2fa/setup", { method: "POST" });
      const payload = await res.json();
      if (!res.ok) {
        toast("error", payload.error || "创建二维码失败");
        return;
      }
      setQr(payload.qrUrl || "");
      setSecret(payload.secret || "");
    } finally {
      setBusy(false);
    }
  }

  async function enable() {
    setBusy(true);
    try {
      const res = await fetch("/api/profile/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const payload = await res.json();
      if (!res.ok) {
        toast("error", payload.error || "开启失败");
        return;
      }
      setRecoveryCodes(Array.isArray(payload.recoveryCodes) ? payload.recoveryCodes : []);
      setQr("");
      setSecret("");
      setCode("");
      toast("success", "2FA 已开启");
      await onUpdated();
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const res = await fetch("/api/profile/2fa", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const payload = await res.json();
      if (!res.ok) {
        toast("error", payload.error || "关闭失败");
        return;
      }
      setCode("");
      setRecoveryCodes([]);
      toast("success", "2FA 已关闭");
      await onUpdated();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[#eceff5] bg-white/80 p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">身份验证（Google Authenticator）</h3>
      <p className="mt-1 text-xs text-slate-500">状态：{data.settings.auth.twoFactorEnabled ? "已开启" : "未开启"}</p>

      {!data.settings.auth.twoFactorEnabled ? (
        <div className="mt-4 space-y-3">
          <button onClick={setup} disabled={busy} className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            {busy ? "生成中..." : "生成二维码"}
          </button>
          {qr && (
            <div className="rounded-lg border border-slate-200 p-3">
              <img src={qr} alt="qr" className="h-40 w-40 rounded border border-slate-200" />
              <p className="mt-2 break-all text-xs text-slate-500">密钥：{secret}</p>
            </div>
          )}
          <div className="flex gap-2">
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="输入 6 位验证码" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <button onClick={enable} disabled={busy || !code} className="rounded-lg bg-accent px-3 py-2 text-sm text-white disabled:opacity-50">
              开启
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="flex gap-2">
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="输入动态码或恢复码" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <button onClick={disable} disabled={busy || !code} className="rounded-lg border border-rose-300 px-3 py-2 text-sm text-rose-700 disabled:opacity-50">
              关闭 2FA
            </button>
          </div>
        </div>
      )}

      {recoveryCodes.length > 0 && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-sm font-medium text-amber-800">恢复码（请妥善保存，仅展示一次）</p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-amber-900">
            {recoveryCodes.map((item) => (
              <code key={item} className="rounded bg-white px-2 py-1">{item}</code>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
