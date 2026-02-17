"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface ProjectData {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  coverImage: string;
  demoUrl: string;
  githubUrl: string;
  tags: string;
  published: boolean;
  featured: boolean;
  sortOrder: number;
}

export function ProjectEditor({ project }: { project?: ProjectData }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: project?.title || "",
    slug: project?.slug || "",
    description: project?.description || "",
    content: project?.content || "",
    coverImage: project?.coverImage || "",
    demoUrl: project?.demoUrl || "",
    githubUrl: project?.githubUrl || "",
    tags: project?.tags ? project.tags.split(",").map((t) => t.trim()).filter(Boolean) : ([] as string[]),
    published: project?.published || false,
    featured: project?.featured || false,
    sortOrder: project?.sortOrder || 0,
  });

  useEffect(() => {
    if (!project && form.title) {
      const slug = form.title
        .toLowerCase()
        .replace(/[^\w\u4e00-\u9fff]+/g, "-")
        .replace(/^-|-$/g, "");
      setForm((f) => ({ ...f, slug }));
    }
  }, [form.title, project]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const url = project ? `/api/projects/${project.id}` : "/api/projects";
    const method = project ? "PUT" : "POST";
    const payload = {
      ...form,
      tags: form.tags,
    };

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      router.push("/admin/projects");
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
        <div className="lg:col-span-2 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">项目标题</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              className="w-full px-3 py-2.5 bg-bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Slug</label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              required
              className="w-full px-3 py-2.5 bg-bg-secondary border border-border rounded-lg text-sm font-mono focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">项目简介</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              required
              className="w-full px-3 py-2.5 bg-bg-secondary border border-border rounded-lg text-sm resize-none focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">详细内容</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={14}
              className="w-full px-3 py-2.5 bg-bg-secondary border border-border rounded-lg text-sm resize-y focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="border border-border rounded-lg p-4 space-y-3">
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
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                className="rounded accent-accent"
              />
              精选
            </label>
            <div>
              <label className="block text-xs text-text-secondary mb-1">排序值（越小越靠前）</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-md text-sm focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div className="border border-border rounded-lg p-4 space-y-3">
            <h3 className="font-medium text-sm">链接与媒体</h3>
            <input
              type="text"
              value={form.coverImage}
              onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
              placeholder="封面图 URL"
              className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-md text-sm focus:outline-none focus:border-accent"
            />
            <label className="block">
              <span className="text-xs text-text-secondary">或上传封面图</span>
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
            <input
              type="url"
              value={form.demoUrl}
              onChange={(e) => setForm({ ...form, demoUrl: e.target.value })}
              placeholder="演示地址（https://...）"
              className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-md text-sm focus:outline-none focus:border-accent"
            />
            <input
              type="url"
              value={form.githubUrl}
              onChange={(e) => setForm({ ...form, githubUrl: e.target.value })}
              placeholder="GitHub 地址（https://...）"
              className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-md text-sm focus:outline-none focus:border-accent"
            />
            <input
              type="text"
              value={form.tags.join(", ")}
              onChange={(e) =>
                setForm({
                  ...form,
                  tags: e.target.value
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter(Boolean),
                })
              }
              placeholder="技术标签，逗号分隔"
              className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-md text-sm focus:outline-none focus:border-accent"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 bg-accent text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? "保存中..." : project ? "更新项目" : "创建项目"}
          </button>
        </div>
      </div>
    </form>
  );
}
