"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { markdownToHtml } from "@/lib/client-markdown";
import { MarkdownEnhancer } from "@/components/blog/MarkdownEnhancer";

type CategoryItem = { id: string; name: string };
type TagItem = { id: string; name: string };

type ComposerProps = {
  mode: "create" | "edit";
  postId?: string;
  initial?: {
    title: string;
    excerpt: string;
    content: string;
    published: boolean;
    coverImage?: string;
    categoryId?: string | null;
    tagIds?: string[];
  };
};

export function ProfilePostComposer({ mode, postId, initial }: ComposerProps) {
  const router = useRouter();
  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const uploadRef = useRef<HTMLInputElement | null>(null);
  const coverUploadRef = useRef<HTMLInputElement | null>(null);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [localUpload, setLocalUpload] = useState(true);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [allTags, setAllTags] = useState<TagItem[]>([]);
  const [tagInput, setTagInput] = useState("");

  const [form, setForm] = useState({
    title: initial?.title || "",
    excerpt: initial?.excerpt || "",
    content: initial?.content || "",
    published: initial?.published ?? true,
    coverImage: initial?.coverImage || "",
    categoryId: initial?.categoryId || "",
    tagIds: initial?.tagIds || ([] as string[]),
  });

  useEffect(() => {
    void (async () => {
      const [categoriesRes, tagsRes] = await Promise.all([
        fetch("/api/categories", { cache: "no-store" }),
        fetch("/api/tags", { cache: "no-store" }),
      ]);
      const categoriesData = await categoriesRes.json();
      const tagsData = await tagsRes.json();
      if (Array.isArray(categoriesData)) {
        setCategories(categoriesData.map((item) => ({ id: item.id, name: item.name })));
      }
      if (Array.isArray(tagsData)) {
        setAllTags(tagsData.map((item) => ({ id: item.id, name: item.name })));
      }
    })();
  }, []);

  useEffect(() => {
    if (mode !== "create") return;
    const key = "profile-post-draft";
    const raw = localStorage.getItem(key);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as typeof form;
      if (!initial) setForm(parsed);
    } catch {
      // ignore invalid draft
    }
  }, [mode, initial]);

  useEffect(() => {
    if (mode !== "create") return;
    const key = "profile-post-draft";
    const timer = window.setTimeout(() => {
      localStorage.setItem(key, JSON.stringify(form));
    }, 500);
    return () => window.clearTimeout(timer);
  }, [form, mode]);

  const previewHtml = useMemo(() => markdownToHtml(form.content || ""), [form.content]);
  const wordCount = useMemo(() => (form.content || "").replace(/\s+/g, "").length, [form.content]);
  const readingMinutes = useMemo(() => Math.max(1, Math.ceil(wordCount / 300)), [wordCount]);

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

  async function uploadFile(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    if (localUpload) formData.append("provider", "local");
    const response = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "上传失败");
    return String(data.url || "");
  }

  async function handleInlineUpload(file: File) {
    setUploading(true);
    try {
      const url = await uploadFile(file);
      insertAtCursor(`\n![${file.name}](${url})\n`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "上传失败");
    } finally {
      setUploading(false);
    }
  }

  async function handleCoverUpload(file: File) {
    setUploading(true);
    try {
      const url = await uploadFile(file);
      setForm((f) => ({ ...f, coverImage: url }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "上传失败");
    } finally {
      setUploading(false);
    }
  }

  function addTagByName(name: string) {
    const normalized = name.trim().toLowerCase();
    if (!normalized) return;
    const matched = allTags.find((tag) => tag.name.toLowerCase() === normalized);
    if (!matched) return;
    setForm((f) => {
      if (f.tagIds.includes(matched.id) || f.tagIds.length >= 10) return f;
      return { ...f, tagIds: [...f.tagIds, matched.id] };
    });
  }

  async function submit() {
    if (!form.title.trim() || !form.content.trim()) {
      setMessage("标题与内容不能为空");
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      const url = mode === "create" ? "/api/profile/posts" : `/api/profile/posts/${postId}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "保存失败");
        return;
      }

      if (mode === "create") localStorage.removeItem("profile-post-draft");
      router.push(`/blog/${data?.post?.slug || ""}`);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white/90 p-4">
        <input
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="输入标题（必填）"
          className="w-full rounded-lg border border-slate-300 px-3 py-3 text-lg font-semibold"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm text-slate-600">正文（Markdown）</p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>{wordCount} 字</span>
              <span>约 {readingMinutes} 分钟</span>
            </div>
          </div>
          <textarea
            ref={editorRef}
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            rows={26}
            className="w-full min-h-[72vh] rounded-lg border border-slate-300 px-3 py-3 text-sm font-mono leading-relaxed"
            placeholder="支持代码块、表格、任务列表、引用块、详情折叠。"
            onPaste={(e) => {
              const file = e.clipboardData.files?.[0];
              if (file && file.type.startsWith("image/")) {
                e.preventDefault();
                void handleInlineUpload(file);
              }
            }}
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1 text-xs text-slate-500">
              <input type="checkbox" checked={localUpload} onChange={(e) => setLocalUpload(e.target.checked)} className="rounded" />
              上传到本地 `/uploads`
            </label>
            <button type="button" onClick={() => uploadRef.current?.click()} className="rounded-md border border-slate-300 px-2 py-1 text-xs">
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
            {uploading && <span className="text-xs text-slate-500">上传中...</span>}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
            <h3 className="text-sm font-semibold">文章元数据</h3>
            <textarea
              value={form.excerpt}
              onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
              rows={4}
              maxLength={300}
              placeholder="摘要（可选，建议 200-300 字）"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm resize-none"
            />
            <input
              type="text"
              value={form.coverImage}
              onChange={(e) => setForm((f) => ({ ...f, coverImage: e.target.value }))}
              placeholder="封面图 URL"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <button type="button" onClick={() => coverUploadRef.current?.click()} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
              上传封面图
            </button>
            <input
              ref={coverUploadRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleCoverUpload(file);
                e.currentTarget.value = "";
              }}
            />
            {!!form.coverImage && (
              <img src={form.coverImage} alt="cover" className="w-full rounded-lg border border-slate-200 object-cover aspect-video" />
            )}
            <select
              value={form.categoryId}
              onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">无分类</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <div>
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTagByName(tagInput);
                    setTagInput("");
                  }
                }}
                placeholder="输入标签名后回车（最多10个）"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <div className="mt-2 flex flex-wrap gap-1">
                {allTags.slice(0, 20).map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() =>
                      setForm((f) =>
                        f.tagIds.includes(tag.id)
                          ? { ...f, tagIds: f.tagIds.filter((id) => id !== tag.id) }
                          : f.tagIds.length >= 10
                            ? f
                            : { ...f, tagIds: [...f.tagIds, tag.id] }
                      )
                    }
                    className={`rounded-full border px-2 py-0.5 text-xs ${
                      form.tagIds.includes(tag.id) ? "border-[#f05d9a] bg-[#fce7f3] text-[#a61e5d]" : "border-slate-300 text-slate-600"
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={form.published} onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))} />
              立即发布
            </label>
            <button type="button" onClick={submit} disabled={saving} className="w-full rounded-lg bg-accent px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50">
              {saving ? "保存中..." : mode === "create" ? "发布文章" : "保存修改"}
            </button>
            <button type="button" onClick={() => router.push("/settings/profile?tab=posts")} className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700">
              返回
            </button>
            {message && <p className="text-xs text-rose-600">{message}</p>}
          </div>
        </aside>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-base font-semibold text-slate-900">实时预览</h2>
        <div id="profile-post-composer-preview" className="prose prose-sm mt-3 max-w-none rounded-lg border border-slate-200 bg-white p-4 min-h-[420px]" dangerouslySetInnerHTML={{ __html: previewHtml }} />
        <MarkdownEnhancer containerId="profile-post-composer-preview" onImageClick={setLightboxImage} />
      </div>

      {lightboxImage && (
        <div className="post-modal-mask fixed inset-0 z-[120] flex items-center justify-center p-4" onClick={() => setLightboxImage(null)}>
          <div className="post-lightbox max-h-[90vh] max-w-[90vw] p-3" onClick={(e) => e.stopPropagation()}>
            <img src={lightboxImage} alt="preview" className="max-h-[80vh] max-w-[85vw] rounded-lg object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
