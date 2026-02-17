"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface FriendData {
  id: string;
  name: string;
  description: string;
  url: string;
  avatar: string;
  featured: boolean;
  sortOrder: number;
}

export function FriendEditor({ friend }: { friend?: FriendData }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    name: friend?.name || "",
    description: friend?.description || "",
    url: friend?.url || "",
    avatar: friend?.avatar || "",
    featured: friend?.featured || false,
    sortOrder: friend?.sortOrder || 0,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const url = friend ? `/api/friends/${friend.id}` : "/api/friends";
    const method = friend ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      router.push("/admin/friends");
      router.refresh();
    } else {
      const data = await res.json();
      alert(data.error || "保存失败");
    }
    setSaving(false);
  }

  async function handleAvatarUpload(file: File) {
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
      setForm((f) => ({ ...f, avatar: data.url || "" }));
    } catch {
      alert("上传失败");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">站点名称</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="w-full px-3 py-2.5 bg-bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">站点地址</label>
          <input
            type="url"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            required
            placeholder="https://example.com"
            className="w-full px-3 py-2.5 bg-bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">描述</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={4}
          className="w-full px-3 py-2.5 bg-bg-secondary border border-border rounded-lg text-sm resize-none focus:outline-none focus:border-accent"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">头像 URL</label>
          <input
            type="text"
            value={form.avatar}
            onChange={(e) => setForm({ ...form, avatar: e.target.value })}
            className="w-full px-3 py-2.5 bg-bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:border-accent"
          />
          <label className="block mt-2">
            <span className="text-xs text-text-secondary">或上传头像</span>
            <input
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleAvatarUpload(file);
                e.currentTarget.value = "";
              }}
              className="mt-2 block w-full text-xs text-text-secondary file:mr-2 file:px-2.5 file:py-1.5 file:border file:border-border file:rounded-md file:bg-bg-secondary file:text-text-secondary"
            />
          </label>
          {uploading && <p className="text-xs text-text-secondary mt-1">上传中...</p>}
        </div>
        <div className="border border-border rounded-lg p-4 space-y-3">
          <h3 className="font-medium text-sm">显示设置</h3>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setForm({ ...form, featured: e.target.checked })}
              className="rounded accent-accent"
            />
            设为精选
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
      </div>

      <button
        type="submit"
        disabled={saving}
        className="px-6 py-2.5 bg-accent text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {saving ? "保存中..." : friend ? "更新友链" : "创建友链"}
      </button>
    </form>
  );
}
