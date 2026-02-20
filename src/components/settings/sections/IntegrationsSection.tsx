"use client";

import { useEffect, useMemo, useState } from "react";
import { signIn } from "next-auth/react";
import type { MeOverview } from "@/components/settings/types";

type Props = {
  data: MeOverview;
  onUpdated: () => Promise<unknown>;
  toast: (type: "success" | "error", message: string) => void;
};

type BindInfo = {
  provider: "telegram" | "feishu";
  code: string;
  deepLink?: string;
  expiresAt: number;
} | null;

export default function IntegrationsSection({ data, onUpdated, toast }: Props) {
  const [bindInfo, setBindInfo] = useState<BindInfo>(null);
  const [starting, setStarting] = useState<"telegram" | "feishu" | "">("");
  const [remainingMs, setRemainingMs] = useState(0);

  useEffect(() => {
    if (!bindInfo) {
      setRemainingMs(0);
      return;
    }
    const tick = () => setRemainingMs(Math.max(0, bindInfo.expiresAt - Date.now()));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [bindInfo]);

  useEffect(() => {
    if (!bindInfo || remainingMs > 0) return;
    (async () => {
      await onUpdated();
      setBindInfo(null);
      toast("success", "绑定码已过期，已自动刷新绑定状态");
    })();
  }, [bindInfo, remainingMs, onUpdated, toast]);

  const countdownText = useMemo(() => {
    if (!bindInfo) return "";
    const total = Math.ceil(remainingMs / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }, [bindInfo, remainingMs]);

  async function unlink(provider: "github" | "google" | "telegram" | "feishu") {
    const res = await fetch("/api/me/integrations", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider }),
    });
    const payload = await res.json();
    if (!res.ok) {
      toast("error", payload.error || "解绑失败");
      return;
    }
    toast("success", `${provider} 已解绑`);
    await onUpdated();
  }

  async function startBotBind(provider: "telegram" | "feishu") {
    setStarting(provider);
    try {
      const res = await fetch("/api/me/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      const payload = await res.json();
      if (!res.ok) {
        toast("error", payload.error || "生成绑定码失败");
        return;
      }
      setBindInfo({
        provider,
        code: payload.code,
        deepLink: payload.deepLink,
        expiresAt: payload.expiresAt,
      });
    } finally {
      setStarting("");
    }
  }

  return (
    <div className="rounded-2xl border border-[#eceff5] bg-white/80 p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">绑定与集成</h3>
      <div className="mt-4 space-y-3">
        <IntegrationRow
          label="GitHub"
          bound={data.integrations.github}
          note={data.integrations.github ? "已绑定 OAuth" : "未绑定"}
          onBind={() => signIn("github", { callbackUrl: "/settings/profile?tab=integrations" })}
          onUnbind={() => unlink("github")}
        />
        <IntegrationRow
          label="Google"
          bound={data.integrations.google}
          note={data.integrations.google ? "已绑定 OAuth" : "未绑定"}
          onBind={() => signIn("google", { callbackUrl: "/settings/profile?tab=integrations" })}
          onUnbind={() => unlink("google")}
        />
        <IntegrationRow
          label="Telegram"
          bound={data.integrations.telegram}
          note={data.integrations.telegram ? `已绑定 @${data.integrations.telegramUsername || "user"}` : "通过机器人绑定码绑定"}
          onBind={() => startBotBind("telegram")}
          onUnbind={() => unlink("telegram")}
          loading={starting === "telegram"}
        />
        <IntegrationRow
          label="飞书机器人"
          bound={data.integrations.feishu}
          note={data.integrations.feishu ? `已绑定 ${data.integrations.feishuName || "feishu-user"}` : "通过飞书机器人绑定码绑定"}
          onBind={() => startBotBind("feishu")}
          onUnbind={() => unlink("feishu")}
          loading={starting === "feishu"}
        />
      </div>

      {bindInfo && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
          <p className="font-medium text-amber-900">{bindInfo.provider === "telegram" ? "Telegram" : "飞书"} 绑定码</p>
          <p className="mt-1 text-amber-800">请向机器人发送：<code className="rounded bg-white px-1.5 py-0.5">bind_{bindInfo.code}</code></p>
          {bindInfo.deepLink && (
            <a href={bindInfo.deepLink} target="_blank" rel="noreferrer" className="mt-2 inline-flex rounded-md border border-amber-300 px-2 py-1 text-xs text-amber-900 hover:bg-amber-100">
              打开机器人并自动填充
            </a>
          )}
          <p className="mt-2 text-xs text-amber-700">
            有效期到：{new Date(bindInfo.expiresAt).toLocaleString("zh-CN")}，剩余 {countdownText}（到期将自动刷新状态）。
          </p>
          <button onClick={() => onUpdated()} className="mt-2 rounded-md bg-accent px-3 py-1.5 text-xs text-white hover:opacity-90">刷新绑定状态</button>
        </div>
      )}
    </div>
  );
}

function IntegrationRow({
  label,
  bound,
  note,
  onBind,
  onUnbind,
  loading,
}: {
  label: string;
  bound: boolean;
  note: string;
  onBind: () => void;
  onUnbind: () => void;
  loading?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-3">
      <div>
        <p className="text-sm font-medium text-slate-800">{label}</p>
        <p className="text-xs text-slate-500">{note}</p>
      </div>
      {bound ? (
        <button onClick={onUnbind} className="rounded-lg border border-rose-300 px-3 py-1.5 text-xs text-rose-700 hover:bg-rose-50">
          解绑
        </button>
      ) : (
        <button onClick={onBind} disabled={loading} className="rounded-lg bg-accent px-3 py-1.5 text-xs text-white hover:opacity-90 disabled:opacity-50">
          {loading ? "生成中..." : "绑定"}
        </button>
      )}
    </div>
  );
}
