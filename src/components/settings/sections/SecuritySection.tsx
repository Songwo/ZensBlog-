"use client";

import type { MeOverview } from "@/components/settings/types";

type Props = {
  data: MeOverview;
  onUpdated: () => Promise<unknown>;
  toast: (type: "success" | "error", message: string) => void;
};

export default function SecuritySection({ data, onUpdated, toast }: Props) {
  async function logoutOthers() {
    const res = await fetch("/api/me/sessions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentSessionId: data.currentSessionId }),
    });
    const payload = await res.json();
    if (!res.ok) {
      toast("error", payload.error || "操作失败");
      return;
    }
    toast("success", "已退出其他设备");
    await onUpdated();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#eceff5] bg-white/80 p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">安全与隐私</h3>
        <p className="mt-1 text-xs text-slate-500">查看最近会话设备，并可退出其他设备。</p>
        <button onClick={logoutOthers} className="mt-3 rounded-lg border border-rose-300 px-3 py-2 text-sm text-rose-700 hover:bg-rose-50">
          退出其他设备
        </button>
      </div>

      <div className="rounded-2xl border border-[#eceff5] bg-white/80 p-5 shadow-sm">
        <h4 className="text-sm font-semibold text-slate-900">登录设备/会话</h4>
        <div className="mt-3 space-y-2">
          {data.sessions.map((s) => (
            <div key={s.id} className="rounded-lg border border-slate-200 p-3 text-sm">
              <p className="font-medium text-slate-800">{s.ua}</p>
              <p className="mt-1 text-xs text-slate-500">最近活跃: {new Date(s.lastSeenAt).toLocaleString("zh-CN")}</p>
              <p className="mt-0.5 text-xs text-slate-500">IP Hash: {s.ipHash.slice(0, 16)}...</p>
              {s.id === data.currentSessionId && (
                <span className="mt-2 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] text-emerald-700">当前设备</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
