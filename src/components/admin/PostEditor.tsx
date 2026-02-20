"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { markdownToHtml } from "@/lib/client-markdown";
import { MarkdownEnhancer } from "@/components/blog/MarkdownEnhancer";

interface PostEditorProps {
  post?: {
    id: string;
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    coverImage: string;
    published: boolean;
    pinned: boolean;
    categoryId: string | null;
    tags: { tag: { id: string; name: string } }[];
  };
  categories: { id: string; name: string }[];
  allTags: { id: string; name: string }[];
}

export function PostEditor({ post, categories, allTags }: PostEditorProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [localUpload, setLocalUpload] = useState(true);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [previewZoom, setPreviewZoom] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const inlineUploadRef = useRef<HTMLInputElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const syncSourceRef = useRef<"editor" | "preview" | null>(null);
  const [form, setForm] = useState({
    title: post?.title || "",
    slug: post?.slug || "",
    content: post?.content || "",
    excerpt: post?.excerpt || "",
    coverImage: post?.coverImage || "",
    published: post?.published || false,
    pinned: post?.pinned || false,
    categoryId: post?.categoryId || "",
    tagIds: post?.tags.map((t) => t.tag.id) || [] as string[],
  });

  // Auto-generate slug from title
  useEffect(() => {
    if (!post && form.title) {
      const slug = form.title
        .toLowerCase()
        .replace(/[^\w\u4e00-\u9fff]+/g, "-")
        .replace(/^-|-$/g, "");
      setForm((f) => ({ ...f, slug }));
    }
  }, [form.title, post]);

  const previewHtml = useMemo(() => markdownToHtml(form.content || ""), [form.content]);

  useEffect(() => {
    const root = previewRef.current;
    if (!root) return;
    root.id = "admin-post-preview";
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    const preview = previewRef.current;
    if (!editor || !preview) return;

    const syncScroll = (from: HTMLElement, to: HTMLElement) => {
      const fromMax = from.scrollHeight - from.clientHeight;
      const toMax = to.scrollHeight - to.clientHeight;
      if (fromMax <= 0 || toMax <= 0) return;
      to.scrollTop = (from.scrollTop / fromMax) * toMax;
    };

    const onEditorScroll = () => {
      if (syncSourceRef.current === "preview") return;
      syncSourceRef.current = "editor";
      syncScroll(editor, preview);
      requestAnimationFrame(() => {
        syncSourceRef.current = null;
      });
    };

    const onPreviewScroll = () => {
      if (syncSourceRef.current === "editor") return;
      syncSourceRef.current = "preview";
      syncScroll(preview, editor);
      requestAnimationFrame(() => {
        syncSourceRef.current = null;
      });
    };

    editor.addEventListener("scroll", onEditorScroll, { passive: true });
    preview.addEventListener("scroll", onPreviewScroll, { passive: true });

    return () => {
      editor.removeEventListener("scroll", onEditorScroll);
      preview.removeEventListener("scroll", onPreviewScroll);
    };
  }, []);

  function toggleTag(tagId: string) {
    setForm((f) => ({
      ...f,
      tagIds: f.tagIds.includes(tagId)
        ? f.tagIds.filter((id) => id !== tagId)
        : [...f.tagIds, tagId],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const url = post ? `/api/posts/${post.id}` : "/api/posts";
    const method = post ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      router.push("/admin/posts");
      router.refresh();
    } else {
      const data = await res.json();
      alert(data.error || "保存失败");
    }
    setSaving(false);
  }

  async function handleCoverUpload(file: File) {
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
      setForm((f) => ({ ...f, coverImage: data.url || "" }));
    } catch {
      alert("上传失败");
    } finally {
      setUploading(false);
    }
  }

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
    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + text.length;
      textarea.selectionStart = cursor;
      textarea.selectionEnd = cursor;
    });
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
      const line = `\n![${file.name}](${data.url})\n`;
      insertAtCursor(line);
    } catch {
      alert("上传失败");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">标题</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              className="w-full px-3 py-2.5 bg-bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:border-accent"
              placeholder="文章标题"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Slug</label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              required
              className="w-full px-3 py-2.5 bg-bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:border-accent font-mono"
              placeholder="url-slug"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">摘要</label>
            <textarea
              value={form.excerpt}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
              rows={2}
              className="w-full px-3 py-2.5 bg-bg-secondary border border-border rounded-lg text-sm resize-none focus:outline-none focus:border-accent"
              placeholder="文章摘要（可选）"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">内容 (Markdown)</label>
            <div className="grid xl:grid-cols-2 gap-4">
              <section className="rounded-lg border border-border bg-bg-secondary p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs text-text-secondary">左侧编写 Markdown，支持 GFM、代码块、表格、任务列表。</p>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 text-xs text-text-secondary">
                      <input
                        type="checkbox"
                        checked={localUpload}
                        onChange={(e) => setLocalUpload(e.target.checked)}
                        className="rounded accent-accent"
                      />
                      上传到本地 `/uploads`
                    </label>
                    <button
                      type="button"
                      onClick={() => inlineUploadRef.current?.click()}
                      className="rounded-md border border-border px-2 py-1 text-xs hover:border-accent"
                    >
                      上传并插入图片
                    </button>
                    <input
                      ref={inlineUploadRef}
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
                </div>
                <textarea
                  ref={editorRef}
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  rows={24}
                  required
                  className="h-[620px] w-full overflow-y-auto px-3 py-2.5 bg-bg-secondary border border-border rounded-lg text-sm font-mono resize-none focus:outline-none focus:border-accent leading-relaxed"
                  placeholder="使用 Markdown 编写文章内容..."
                />
              </section>

              <section className="rounded-lg border border-border bg-bg-secondary p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs text-text-secondary">实时预览（所见即所得风格）</p>
                  <button type="button" onClick={() => setPreviewZoom(true)} className="text-xs rounded border border-border px-2 py-0.5 hover:border-accent">
                    放大预览
                  </button>
                </div>
                <div
                  ref={previewRef}
                  className="prose prose-sm max-w-none rounded-lg border border-border bg-white p-4 h-[620px] overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: previewHtml || "<p>暂无内容</p>" }}
                />
                <MarkdownEnhancer containerId="admin-post-preview" onImageClick={setLightboxImage} />
              </section>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="border border-border rounded-lg p-4 space-y-4">
            <h3 className="font-medium text-sm">发布设置</h3>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => setForm({ ...form, published: e.target.checked })}
                className="rounded accent-accent"
              />
              发布
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.pinned}
                onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
                className="rounded accent-accent"
              />
              置顶
            </label>
          </div>

          <div className="border border-border rounded-lg p-4 space-y-3">
            <h3 className="font-medium text-sm">分类</h3>
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-md text-sm focus:outline-none focus:border-accent"
            >
              <option value="">无分类</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="border border-border rounded-lg p-4 space-y-3">
            <h3 className="font-medium text-sm">标签</h3>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    form.tagIds.includes(tag.id)
                      ? "border-accent text-accent bg-accent/10"
                      : "border-border text-text-secondary hover:border-accent"
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>

          <div className="border border-border rounded-lg p-4 space-y-3">
            <h3 className="font-medium text-sm">封面图</h3>
            <input
              type="text"
              value={form.coverImage}
              onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
              className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-md text-sm focus:outline-none focus:border-accent"
              placeholder="图片 URL"
            />
            <label className="block">
              <span className="text-xs text-text-secondary">或上传图片（自动写入 URL）</span>
              <input
                type="file"
                accept="image/*"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleCoverUpload(file);
                  e.currentTarget.value = "";
                }}
                className="mt-2 block w-full text-xs text-text-secondary file:mr-2 file:px-2.5 file:py-1.5 file:border file:border-border file:rounded-md file:bg-bg-secondary file:text-text-secondary"
              />
            </label>
            {uploading && <p className="text-xs text-text-secondary">上传中...</p>}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 bg-accent text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? "保存中..." : post ? "更新文章" : "创建文章"}
          </button>
        </div>
      </div>

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

      {previewZoom && (
        <div className="post-modal-mask fixed inset-0 z-[121] flex items-center justify-center p-4" onClick={() => setPreviewZoom(false)}>
          <div className="post-lightbox max-h-[92vh] max-w-[95vw] p-3 overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div id="admin-post-preview-zoom" className="prose prose-base max-w-none rounded-lg border border-border bg-white p-5" dangerouslySetInnerHTML={{ __html: previewHtml || "<p>暂无内容</p>" }} />
            <MarkdownEnhancer containerId="admin-post-preview-zoom" onImageClick={setLightboxImage} />
            <button type="button" className="post-action-btn mt-3 w-full" onClick={() => setPreviewZoom(false)}>
              关闭预览
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
