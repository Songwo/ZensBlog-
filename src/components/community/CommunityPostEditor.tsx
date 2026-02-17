"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

function simpleMarkdownToHtml(input: string) {
  return input
    .replace(/^### (.*)$/gm, "<h3>$1</h3>")
    .replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .replace(/^# (.*)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br/>");
}

export function CommunityPostEditor() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    content: "",
    excerpt: "",
  });

  const previewHtml = useMemo(() => simpleMarkdownToHtml(form.content), [form.content]);

  async function publish() {
    setSaving(true);
    const res = await fetch("/api/community/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "发布失败");
      setSaving(false);
      return;
    }
    router.push(`/community`);
    router.refresh();
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <section className="rounded-xl border border-[#eceff5] bg-white/70 p-5">
        <h2 className="text-lg font-semibold text-[#111111] mb-4">发帖编辑器</h2>
        <div className="space-y-3">
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="标题"
            className="w-full rounded-md border border-[#e2e8f0] px-3 py-2 text-sm"
          />
          <textarea
            value={form.excerpt}
            onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
            placeholder="摘要（可选）"
            rows={2}
            className="w-full rounded-md border border-[#e2e8f0] px-3 py-2 text-sm resize-none"
          />
          <textarea
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="支持 Markdown，实时预览在右侧。"
            rows={14}
            className="w-full rounded-md border border-[#e2e8f0] px-3 py-2 text-sm resize-y font-mono"
          />
          <button onClick={publish} disabled={saving || !form.title || !form.content} className="rounded-md bg-accent px-4 py-2 text-sm text-white disabled:opacity-50">
            {saving ? "发布中..." : "发布帖子"}
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-[#eceff5] bg-white/70 p-5">
        <h2 className="text-lg font-semibold text-[#111111] mb-4">实时预览</h2>
        <h3 className="text-xl font-bold text-[#111111]">{form.title || "标题预览"}</h3>
        {form.excerpt && <p className="text-sm text-[#64748b] mt-2">{form.excerpt}</p>}
        <div
          className="prose prose-sm mt-4 max-w-none text-[#334155]"
          dangerouslySetInnerHTML={{ __html: previewHtml || "<p>在左侧输入 Markdown 内容。</p>" }}
        />
      </section>
    </div>
  );
}

