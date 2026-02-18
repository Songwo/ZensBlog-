"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { markdownToHtml } from "@/lib/client-markdown";
import { MarkdownEnhancer } from "@/components/blog/MarkdownEnhancer";

export function CommunityPostEditor() {
  const router = useRouter();
  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const uploadRef = useRef<HTMLInputElement | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [localUpload, setLocalUpload] = useState(true);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    content: "",
    excerpt: "",
  });

  const previewHtml = useMemo(() => markdownToHtml(form.content), [form.content]);

  function insertAtCursor(text: string) {
    const textarea = editorRef.current;
    if (!textarea) {
      setForm((f) => ({ ...f, content: `${f.content}${text}` }));
      return;
    }
    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || start;
    const next = `${form.content.slice(0, start)}${text}${form.content.slice(end)}`;
    setForm((f) => ({ ...f, content: next }));
  }

  async function handleInlineUpload(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (localUpload) formData.append("provider", "local");
      const response = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) {
        alert(data.error || "上传失败");
        return;
      }
      insertAtCursor(`\n![${file.name}](${data.url})\n`);
    } catch {
      alert("上传失败");
    } finally {
      setUploading(false);
    }
  }

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
    router.push(`/community/${data.slug || ""}`);
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
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1 text-xs text-[#64748b]">
              <input type="checkbox" checked={localUpload} onChange={(e) => setLocalUpload(e.target.checked)} className="rounded accent-accent" />
              上传到本地 `/uploads`
            </label>
            <button type="button" onClick={() => uploadRef.current?.click()} className="rounded-md border border-[#e2e8f0] px-2 py-1 text-xs hover:border-accent">
              上传并插入图片
            </button>
            <input
              ref={uploadRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleInlineUpload(file);
                e.currentTarget.value = "";
              }}
            />
          </div>
          <textarea
            ref={editorRef}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="支持 Markdown，代码块、表格、任务列表、引用、折叠详情。"
            rows={18}
            className="w-full rounded-md border border-[#e2e8f0] px-3 py-2 text-sm resize-y font-mono"
          />
          {uploading && <p className="text-xs text-[#64748b]">上传中...</p>}
          <button onClick={publish} disabled={saving || !form.title || !form.content} className="rounded-md bg-accent px-4 py-2 text-sm text-white disabled:opacity-50">
            {saving ? "发布中..." : "发布帖子"}
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-[#eceff5] bg-white/70 p-5">
        <h2 className="text-lg font-semibold text-[#111111] mb-4">实时预览</h2>
        <h3 className="text-xl font-bold text-[#111111]">{form.title || "标题预览"}</h3>
        {form.excerpt && <p className="text-sm text-[#64748b] mt-2">{form.excerpt}</p>}
        <div id="community-editor-preview" className="prose prose-sm mt-4 max-w-none rounded-lg border border-[#e2e8f0] bg-white p-4 min-h-[520px]" dangerouslySetInnerHTML={{ __html: previewHtml }} />
        <MarkdownEnhancer containerId="community-editor-preview" onImageClick={setLightboxImage} />
      </section>

      {lightboxImage && (
        <div className="post-modal-mask fixed inset-0 z-[120] flex items-center justify-center p-4" onClick={() => setLightboxImage(null)}>
          <div className="post-lightbox max-h-[90vh] max-w-[90vw] p-3" onClick={(e) => e.stopPropagation()}>
            <img src={lightboxImage} alt="preview" className="max-h-[80vh] max-w-[85vw] rounded-lg object-contain" />
            <button type="button" className="post-action-btn mt-3 w-full" onClick={() => setLightboxImage(null)}>
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

