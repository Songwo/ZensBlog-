"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { AvatarWithBadge } from "@/components/blog/AvatarWithBadge";

type TabKey = "posts" | "comments" | "likes" | "projects" | "messages";

type BadgeItem = {
  id: string;
  name: string;
  icon: string;
  iconUrl?: string | null;
  color: string;
  description: string;
};

type ProfilePayload = {
  profile: {
    id: string;
    username?: string | null;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    bio?: string | null;
    title?: string | null;
    about?: string | null;
    company?: string | null;
    location?: string | null;
    blog?: string | null;
    website?: string | null;
    twitter?: string | null;
    linkedin?: string | null;
    githubProfile?: string | null;
    activeBadgeId?: string | null;
  };
  stats: {
    postCount: number;
    commentCount: number;
    receivedLikes: number;
  };
  badges: BadgeItem[];
  history: {
    tab: "posts" | "comments" | "likes";
    page: number;
    totalPages: number;
    items: Array<Record<string, unknown>>;
  };
};

type RepoItem = {
  id: number;
  name: string;
  fullName: string;
  url: string;
  description: string | null;
  stars: number;
  language: string | null;
  isFork: boolean;
  updatedAt: string;
};

type InboxMessage = {
  id: string;
  content: string;
  readAt: string | null;
  createdAt: string;
  sender: {
    id: string;
    username: string | null;
    name: string | null;
    image: string | null;
  };
};

export default function ProfileSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState<TabKey>("posts");
  const [page, setPage] = useState(1);

  const [stats, setStats] = useState<ProfilePayload["stats"] | null>(null);
  const [history, setHistory] = useState<ProfilePayload["history"] | null>(null);
  const [badges, setBadges] = useState<BadgeItem[]>([]);
  const [activeBadgeId, setActiveBadgeId] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  const [repos, setRepos] = useState<RepoItem[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);

  const [inbox, setInbox] = useState<InboxMessage[]>([]);
  const [unreadInbox, setUnreadInbox] = useState(0);
  const [loadingInbox, setLoadingInbox] = useState(false);
  const [receiverUsername, setReceiverUsername] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    bio: "",
    title: "",
    about: "",
    company: "",
    location: "",
    blog: "",
    website: "",
    twitter: "",
    linkedin: "",
  });

  async function loadProfile(historyTab: "posts" | "comments" | "likes", historyPage = 1) {
    const res = await fetch(`/api/profile?tab=${historyTab}&page=${historyPage}&pageSize=8`, { cache: "no-store" });
    const data = (await res.json()) as ProfilePayload | { error?: string };
    if (!res.ok || !("profile" in data)) {
      setMessage(("error" in data && data.error) || "加载个人信息失败");
      return;
    }
    setForm({
      name: data.profile.name || "",
      email: data.profile.email || "",
      bio: data.profile.bio || "",
      title: data.profile.title || "",
      about: data.profile.about || "",
      company: data.profile.company || "",
      location: data.profile.location || "",
      blog: data.profile.blog || "",
      website: data.profile.website || "",
      twitter: data.profile.twitter || "",
      linkedin: data.profile.linkedin || "",
    });
    setStats(data.stats);
    setHistory(data.history);
    setBadges(Array.isArray(data.badges) ? data.badges : []);
    setActiveBadgeId(data.profile.activeBadgeId || null);
    setProfileImage(data.profile.image || null);
    setUsername(data.profile.username || null);
  }

  async function loadRepos() {
    setLoadingRepos(true);
    try {
      const res = await fetch("/api/profile/github-repos", { cache: "no-store" });
      const data = (await res.json()) as { repos?: RepoItem[]; error?: string };
      if (!res.ok) {
        setMessage(data.error || "加载 GitHub 仓库失败");
        return;
      }
      setRepos(Array.isArray(data.repos) ? data.repos : []);
    } finally {
      setLoadingRepos(false);
    }
  }

  async function loadInbox() {
    setLoadingInbox(true);
    try {
      const res = await fetch("/api/messages", { cache: "no-store" });
      const data = (await res.json()) as { unreadCount?: number; inbox?: InboxMessage[]; error?: string };
      if (!res.ok) {
        setMessage(data.error || "加载私信失败");
        return;
      }
      setUnreadInbox(data.unreadCount || 0);
      setInbox(Array.isArray(data.inbox) ? data.inbox : []);
    } finally {
      setLoadingInbox(false);
    }
  }

  useEffect(() => {
    const t = (searchParams.get("tab") || "posts") as TabKey;
    if (["posts", "comments", "likes", "projects", "messages"].includes(t)) {
      setTab(t);
    }
  }, [searchParams]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/settings/profile");
      return;
    }
    if (status !== "authenticated") return;
    (async () => {
      await loadProfile("posts", 1);
      setLoading(false);
    })();
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (tab === "projects") {
      loadRepos();
      return;
    }
    if (tab === "messages") {
      loadInbox();
      return;
    }
    loadProfile(tab, page);
  }, [tab, page, status]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "保存失败");
        return;
      }
      setMessage("资料已更新");
    } finally {
      setSaving(false);
    }
  }

  async function sendMessage() {
    if (!receiverUsername.trim() || !messageContent.trim()) {
      setMessage("请填写接收用户名和消息内容");
      return;
    }
    setSendingMessage(true);
    setMessage("");
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverUsername: receiverUsername.trim(), content: messageContent }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "发送失败");
        return;
      }
      setMessage("私信已发送");
      setMessageContent("");
      if (tab === "messages") loadInbox();
    } finally {
      setSendingMessage(false);
    }
  }

  async function markMessageRead(id: string) {
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markReadId: id }),
    });
    setInbox((prev) => prev.map((m) => (m.id === id ? { ...m, readAt: new Date().toISOString() } : m)));
    setUnreadInbox((c) => Math.max(0, c - 1));
  }

  async function setActiveBadge(badgeId: string) {
    const prev = activeBadgeId;
    setActiveBadgeId(badgeId);
    setMessage("");
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, activeBadgeId: badgeId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActiveBadgeId(prev);
        setMessage(data.error || "设置佩戴徽章失败");
        return;
      }
      setMessage("已更新佩戴徽章");
    } catch {
      setActiveBadgeId(prev);
      setMessage("设置佩戴徽章失败");
    }
  }

  async function deletePost(postId: string) {
    const backupItems = history?.items || [];
    if (!confirm("确认删除这篇文章吗？")) return;
    setHistory((prev) => {
      if (!prev) return prev;
      return { ...prev, items: prev.items.filter((item) => String(item.id || "") !== postId) };
    });
    try {
      const res = await fetch(`/api/profile/posts/${postId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setHistory((prev) => (prev ? { ...prev, items: backupItems } : prev));
        setMessage(data.error || "删除失败");
        return;
      }
      setMessage("文章已删除");
      await loadProfile("posts", page);
    } catch {
      setHistory((prev) => (prev ? { ...prev, items: backupItems } : prev));
      setMessage("删除失败");
    }
  }

  const tabs = useMemo(
    () => [
      { key: "posts" as const, label: "我的文章" },
      { key: "comments" as const, label: "我的评论" },
      { key: "likes" as const, label: "我点赞的文章" },
      { key: "projects" as const, label: "项目" },
      { key: "messages" as const, label: `消息${unreadInbox > 0 ? ` (${unreadInbox})` : ""}` },
    ],
    [unreadInbox]
  );
  const activeBadge = useMemo(
    () => badges.find((badge) => badge.id === activeBadgeId) || badges[0] || null,
    [badges, activeBadgeId]
  );

  if (loading) {
    return <div className="mx-auto max-w-6xl px-4 py-12 text-sm text-slate-500">加载中...</div>;
  }

  return (
    <div className="bg-slate-50/80">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold text-slate-900">个人主页</h1>
        <p className="text-sm text-slate-600 mt-2 mb-6">管理资料、查看历史和消息通知。</p>

        <div className="grid gap-6 lg:grid-cols-[minmax(320px,38%)_1fr]">
          <section className="space-y-6">
            <div className="rounded-xl bg-white shadow-md border border-slate-200 p-5">
              <div className="flex items-start gap-4">
                <div className="relative">
                  <AvatarWithBadge
                    src={profileImage}
                    alt={form.name || session?.user?.name || "用户头像"}
                    fallbackText={form.name || session?.user?.name || "U"}
                    sizeClassName="h-[84px] w-[84px]"
                    badgeIcon={activeBadge?.icon}
                    badgeIconUrl={activeBadge?.iconUrl}
                    badgeColor={activeBadge?.color}
                    badgeTitle={activeBadge ? `${activeBadge.name} · ${activeBadge.description}` : null}
                    badgeSizeClassName="h-6 w-6"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-lg font-semibold text-slate-900">{form.name || session?.user?.name || "未命名用户"}</p>
                  <p className="text-sm text-slate-500 mt-1">@{username || "未设置用户名"}</p>
                  <p className="text-sm text-slate-700 mt-2">{form.title || "尚未设置头衔"}</p>
                </div>
              </div>

              {badges.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {badges.map((badge) => (
                    <button
                      key={badge.id}
                      type="button"
                      className={`rounded-full px-2.5 py-1 text-xs text-white shadow-sm border transition ${
                        activeBadgeId === badge.id ? "border-slate-900 scale-105" : "border-transparent opacity-85 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: badge.color }}
                      title={badge.description}
                      onClick={() => setActiveBadge(badge.id)}
                    >
                      {badge.icon} {badge.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={saveProfile} className="rounded-xl bg-white shadow-md border border-slate-200 p-5 space-y-4">
              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-slate-900">基础信息</legend>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="昵称" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="邮箱" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="头衔" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
              </fieldset>

              <div className="border-t border-slate-100" />

              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-slate-900">个人简介</legend>
                <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} placeholder="简短简介" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm resize-none" />
                <textarea value={form.about} onChange={(e) => setForm({ ...form, about: e.target.value })} rows={5} placeholder="长简介" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm resize-none" />
              </fieldset>

              <div className="border-t border-slate-100" />

              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-slate-900">公司与社交</legend>
                <div className="grid sm:grid-cols-2 gap-3">
                  <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="公司" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
                  <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="所在地" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <input value={form.blog} onChange={(e) => setForm({ ...form, blog: e.target.value })} placeholder="Blog" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
                  <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="Website" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <input value={form.twitter} onChange={(e) => setForm({ ...form, twitter: e.target.value })} placeholder="Twitter/X" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
                  <input value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} placeholder="LinkedIn" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
                </div>
              </fieldset>

              <button type="submit" disabled={saving} className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 text-sm text-white disabled:opacity-50">
                {saving ? "保存中..." : "保存资料"}
              </button>
              {message && <p className="text-xs text-slate-600">{message}</p>}
            </form>
          </section>

          <section className="space-y-6">
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="文章数" value={stats?.postCount ?? 0} />
              <StatCard label="评论数" value={stats?.commentCount ?? 0} />
              <StatCard label="收到点赞" value={stats?.receivedLikes ?? 0} />
            </div>

            <div className="rounded-xl bg-white shadow-md border border-slate-200 p-5">
              <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => {
                      setTab(t.key);
                      setPage(1);
                    }}
                    data-state={tab === t.key ? "active" : "inactive"}
                    className="rounded-md px-3 py-1.5 text-sm border border-transparent transition bg-transparent text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100 data-[state=active]:bg-zinc-700 data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:border-zinc-700 dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-zinc-100 dark:data-[state=active]:border-zinc-700"
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {(tab === "posts" || tab === "comments" || tab === "likes") && (
                <>
                  {tab === "posts" && (
                    <div className="mt-4 flex items-center justify-end">
                      <a href="/settings/profile/posts/new" className="rounded-lg bg-indigo-600 px-3.5 py-2 text-sm text-white hover:bg-indigo-700">
                        新建文章
                      </a>
                    </div>
                  )}
                  <div className="space-y-3 mt-4">
                    {(history?.items || []).map((item, idx) => (
                      <div key={`${tab}-${idx}`} className="rounded-lg border border-slate-200 p-3 text-sm">
                        {tab === "posts" && (
                          <>
                            <p className="font-medium text-slate-900">{String(item.title || "")}</p>
                            <p className="text-xs text-slate-500 mt-1">
                              {String(item.published ? "已发布" : "草稿")} · 👁 {String(item.views || 0)} · 👍 {String(item.likes || 0)} · 💬 {String(item.comments || 0)} · 热度 {String(item.heat || 0)}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <a
                                href={`${String(item.type) === "COMMUNITY" ? "/community" : "/blog"}/${String(item.slug || "")}`}
                                className="rounded-md border border-slate-300 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-50"
                              >
                                查看
                              </a>
                              <a
                                href={`/settings/profile/posts/${String(item.id || "")}/edit`}
                                className="rounded-md border border-indigo-300 px-2.5 py-1 text-xs text-indigo-700 hover:bg-indigo-50"
                              >
                                编辑
                              </a>
                              <button
                                type="button"
                                onClick={() => deletePost(String(item.id || ""))}
                                className="rounded-md border border-rose-300 px-2.5 py-1 text-xs text-rose-700 hover:bg-rose-50"
                              >
                                删除
                              </button>
                            </div>
                          </>
                        )}
                        {tab === "comments" && (
                          <>
                            <p className="text-slate-700">{String(item.content || "")}</p>
                            <p className="text-xs text-slate-500 mt-1">文章：{String((item.post as { title?: string })?.title || "未知文章")}</p>
                          </>
                        )}
                        {tab === "likes" && (
                          <>
                            <p className="font-medium text-slate-900">{String((item.post as { title?: string })?.title || "未知文章")}</p>
                            <p className="text-xs text-slate-500 mt-1">{new Date(String(item.createdAt || Date.now())).toLocaleString("zh-CN")}</p>
                          </>
                        )}
                      </div>
                    ))}
                    {(history?.items?.length || 0) === 0 && (
                      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
                        <p className="text-sm text-slate-500">{tab === "posts" ? "暂无记录，快去写第一篇文章吧！" : "暂无记录"}</p>
                        {tab === "posts" && (
                          <a href="/settings/profile/posts/new" className="mt-3 inline-flex rounded-lg bg-indigo-600 px-3 py-1.5 text-xs text-white hover:bg-indigo-700">
                            去写文章
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={(history?.page || 1) <= 1} className="rounded-md border border-slate-200 px-3 py-1.5 disabled:opacity-50">上一页</button>
                    <span className="text-slate-500">{history?.page || 1} / {history?.totalPages || 1}</span>
                    <button type="button" onClick={() => setPage((p) => Math.min(history?.totalPages || 1, p + 1))} disabled={(history?.page || 1) >= (history?.totalPages || 1)} className="rounded-md border border-slate-200 px-3 py-1.5 disabled:opacity-50">下一页</button>
                  </div>
                </>
              )}

              {tab === "projects" && (
                <div className="mt-4">
                  {loadingRepos ? (
                    <p className="text-sm text-slate-500">加载中...</p>
                  ) : repos.length === 0 ? (
                    <p className="text-sm text-slate-500">暂无可展示仓库</p>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-3">
                      {repos.slice(0, 12).map((repo) => (
                        <a key={repo.id} href={repo.url} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm hover:shadow-md transition">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-blue-600">{repo.name}</p>
                            <span className="text-[10px] rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5">verified</span>
                          </div>
                          <p className="text-xs text-slate-600 line-clamp-2 mt-2 min-h-8">{repo.description || "暂无描述"}</p>
                          <div className="mt-3 flex items-center gap-3 text-[11px] text-slate-500">
                            <span className="inline-flex items-center gap-1">
                              <span className="h-2 w-2 rounded-full bg-indigo-500" />
                              {repo.language || "Unknown"}
                            </span>
                            <span>★ {repo.stars}</span>
                            <span>{new Date(repo.updatedAt).toLocaleDateString("zh-CN")}</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === "messages" && (
                <div className="mt-4 space-y-4">
                  <div className="rounded-lg border border-slate-200 p-3">
                    <p className="text-sm font-medium text-slate-900 mb-2">发送私信</p>
                    <div className="grid sm:grid-cols-[180px_1fr_auto] gap-2">
                      <input value={receiverUsername} onChange={(e) => setReceiverUsername(e.target.value)} placeholder="对方用户名" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                      <input value={messageContent} onChange={(e) => setMessageContent(e.target.value)} placeholder="输入消息内容" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                      <button type="button" onClick={sendMessage} disabled={sendingMessage} className="rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3 py-2 text-sm text-white disabled:opacity-50">
                        发送
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {loadingInbox ? (
                      <p className="text-sm text-slate-500">加载中...</p>
                    ) : inbox.length === 0 ? (
                      <p className="text-sm text-slate-500">收件箱为空</p>
                    ) : (
                      inbox.map((msg) => (
                        <div key={msg.id} className={`rounded-lg border p-3 ${msg.readAt ? "border-slate-200" : "border-indigo-200 bg-indigo-50/50"}`}>
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-slate-900">来自 {msg.sender.name || msg.sender.username || "用户"}</p>
                            {!msg.readAt && (
                              <button type="button" onClick={() => markMessageRead(msg.id)} className="text-xs text-indigo-600">
                                标记已读
                              </button>
                            )}
                          </div>
                          <p className="text-sm text-slate-700 mt-1">{msg.content}</p>
                          <p className="text-[11px] text-slate-500 mt-2">{new Date(msg.createdAt).toLocaleString("zh-CN")}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white shadow-md border border-slate-200 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-2xl font-semibold mt-1 text-slate-900">{value}</p>
    </div>
  );
}
