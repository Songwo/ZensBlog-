"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type PostPayload = {
  post: {
    id: string;
    title: string;
    excerpt: string;
    content: string;
    published: boolean;
  };
};

export default function ProfilePostEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ title: "", excerpt: "", content: "", published: true });

  useEffect(() => {
    const postId = params?.id;
    if (!postId) return;
    (async () => {
      const res = await fetch(`/api/profile/posts/${postId}`, { cache: "no-store" });
      const data = (await res.json()) as PostPayload | { error?: string };
      if (!res.ok || !("post" in data)) {
        setMessage(("error" in data && data.error) || "加载文章失败");
        setLoading(false);
        return;
      }
      setForm({
        title: data.post.title || "",
        excerpt: data.post.excerpt || "",
        content: data.post.content || "",
        published: Boolean(data.post.published),
      });
      setLoading(false);
    })();
  }, [params?.id]);

  async function save() {
    if (!params?.id) return;
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch(`/api/profile/posts/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "保存失败");
        return;
      }
      router.push("/settings/profile?tab=posts");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="mx-auto max-w-4xl px-4 py-12 text-sm text-slate-500">加载中...</div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-slate-900">编辑我的文章</h1>
      <p className="text-sm text-slate-500 mt-2">支持修改标题、摘要、正文和发布状态。</p>

      <div className="mt-6 space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <input
          value={form.title}
          onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
          placeholder="标题"
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
        />
        <textarea
          value={form.excerpt}
          onChange={(e) => setForm((prev) => ({ ...prev, excerpt: e.target.value }))}
          rows={2}
          placeholder="摘要"
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm resize-none"
        />
        <textarea
          value={form.content}
          onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
          rows={16}
          placeholder="正文内容"
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
        />
        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => setForm((prev) => ({ ...prev, published: e.target.checked }))}
          />
          设为已发布
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {saving ? "保存中..." : "保存修改"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/settings/profile?tab=posts")}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700"
          >
            返回
          </button>
        </div>
        {message && <p className="text-xs text-rose-600">{message}</p>}
      </div>
    </div>
  );
}
