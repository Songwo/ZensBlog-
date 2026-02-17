"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={20}
              required
              className="w-full px-3 py-2.5 bg-bg-secondary border border-border rounded-lg text-sm font-mono resize-y focus:outline-none focus:border-accent leading-relaxed"
              placeholder="使用 Markdown 编写文章内容..."
            />
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
    </form>
  );
}
