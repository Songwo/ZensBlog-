"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Toast } from "@/components/settings/Toast";
import { useOverview } from "@/components/settings/use-overview";
import type { SettingsTab } from "@/components/settings/types";

const ProfileSection = dynamic(() => import("@/components/settings/sections/ProfileSection"));
const AccountSection = dynamic(() => import("@/components/settings/sections/AccountSection"));
const SecuritySection = dynamic(() => import("@/components/settings/sections/SecuritySection"));
const AuthSection = dynamic(() => import("@/components/settings/sections/AuthSection"));
const NotificationsSection = dynamic(() => import("@/components/settings/sections/NotificationsSection"));
const IntegrationsSection = dynamic(() => import("@/components/settings/sections/IntegrationsSection"));

const TABS: Array<{ key: SettingsTab; label: string }> = [
  { key: "profile", label: "个人资料" },
  { key: "account", label: "账号与密码" },
  { key: "security", label: "安全与隐私" },
  { key: "auth", label: "身份验证" },
  { key: "notifications", label: "推送渠道" },
  { key: "integrations", label: "绑定集成" },
];

export function SettingsCenter() {
  const { data, loading, error, refresh } = useOverview();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [tab, setTab] = useState<SettingsTab>("profile");
  const [dirty, setDirty] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    const t = (searchParams.get("tab") || "profile") as SettingsTab;
    if (TABS.some((item) => item.key === t)) setTab(t);
  }, [searchParams]);

  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty]);

  function switchTab(next: SettingsTab) {
    if (dirty && !confirm("当前有未保存修改，确认离开吗？")) return;
    setDirty(false);
    setTab(next);
    router.replace(`/settings/profile?tab=${next}`);
  }

  function showToast(type: "success" | "error", message: string) {
    if (type === "success") return;
    setToast({ type, message });
    setTimeout(() => setToast(null), 2500);
  }

  const header = useMemo(() => {
    if (!data) return null;
    return (
      <div className="rounded-2xl border border-[#eceff5] bg-white/80 p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {data.profile.image ? (
            <img src={data.profile.image} alt="avatar" className="h-16 w-16 rounded-full border border-slate-200 object-cover" />
          ) : (
            <div className="grid h-16 w-16 place-items-center rounded-full border border-slate-200 bg-white text-lg font-semibold text-slate-600">
              {(data.profile.name || "U").slice(0, 1)}
            </div>
          )}
          <div className="flex-1">
                <p className="text-lg font-semibold text-slate-900">{data.profile.name || "未设置昵称"}</p>
                <p className="mt-1 text-sm text-slate-500">@{data.profile.username || "未设置用户名"}</p>
                <p className="mt-1 text-sm text-slate-600">{data.profile.bio || "暂无简介"}</p>
                <p className="mt-1 text-xs text-rose-700">
                  {data.level.levelName} · 积分 {data.level.points}
                  {data.level.nextLevelPoints ? ` / 下一级 ${data.level.nextLevelPoints}` : " · 已满级"}
                </p>
              </div>
          <div className="grid grid-cols-4 gap-3 text-center text-xs">
            <Stat label="文章" value={data.stats.posts} />
            <Stat label="评论" value={data.stats.comments} />
            <Stat label="点赞" value={data.stats.likes} />
            <Stat label="阅读" value={data.stats.views} />
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Link href={`/u/${data.profile.username || ""}`} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50">
            查看个人主页
          </Link>
          <Link href="/settings/profile/posts/new" className="rounded-lg bg-accent px-3 py-1.5 text-xs text-white hover:opacity-90">
            新建文章
          </Link>
        </div>
      </div>
    );
  }, [data]);

  if (loading && !data) return <div className="mx-auto max-w-6xl px-4 py-12 text-sm text-slate-500">加载中...</div>;
  if (error && !data) return <div className="mx-auto max-w-6xl px-4 py-12 text-sm text-rose-600">{error}</div>;
  if (!data) return null;

  return (
    <div className="settings-center mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {toast && <Toast type={toast.type} message={toast.message} />}
      <div className="space-y-4">{header}</div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[220px_1fr]">
        <aside className="rounded-2xl border border-[#eceff5] bg-white/80 p-3 shadow-sm lg:h-fit">
          <div className="hidden lg:block space-y-1">
            {TABS.map((item) => (
              <button
                key={item.key}
                onClick={() => switchTab(item.key)}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                  tab === item.key ? "bg-accent text-white" : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 overflow-x-auto lg:hidden">
            {TABS.map((item) => (
              <button
                key={item.key}
                onClick={() => switchTab(item.key)}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs ${
                  tab === item.key ? "bg-accent text-white" : "bg-slate-100 text-slate-700"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </aside>

        <section>
          {tab === "profile" && <ProfileSection data={data} onUpdated={refresh} notifyDirty={setDirty} toast={showToast} />}
          {tab === "account" && <AccountSection toast={showToast} />}
          {tab === "security" && <SecuritySection data={data} onUpdated={refresh} toast={showToast} />}
          {tab === "auth" && <AuthSection data={data} onUpdated={refresh} toast={showToast} />}
          {tab === "notifications" && <NotificationsSection data={data} onUpdated={refresh} notifyDirty={setDirty} toast={showToast} />}
          {tab === "integrations" && <IntegrationsSection data={data} onUpdated={refresh} toast={showToast} />}
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
