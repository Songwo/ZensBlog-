"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface TagItem {
  id: string;
  name: string;
  slug: string;
  _count: { posts: number };
}

export function TagManager({ tags: initial }: { tags: TagItem[] }) {
  const router = useRouter();
  const [tags, setTags] = useState(initial);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;
    setSaving(true);
    const res = await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug }),
    });
    if (res.ok) {
      const data = await res.json();
      setTags((prev) => [...prev, { ...data, _count: { posts: 0 } }]);
      setName("");
      setSlug("");
      router.refresh();
    } else {
      const data = await res.json();
      alert(data.error || "添加失败");
    }
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleAdd} className="flex items-end gap-3">
        <div>
          <label className="block text-sm font-medium mb-1.5">标签名</label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSlug(e.target.value.toLowerCase().replace(/[^\w\u4e00-\u9fff]+/g, "-").replace(/^-|-$/g, ""));
            }}
            className="px-3 py-2 bg-bg-secondary border border-border rounded-md text-sm"
            placeholder="Go / Docker / Next.js"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Slug</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="px-3 py-2 bg-bg-secondary border border-border rounded-md text-sm font-mono"
            placeholder="go"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-accent text-white text-sm rounded-md disabled:opacity-50"
        >
          添加标签
        </button>
      </form>

      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-secondary">
              <th className="text-left px-4 py-3 font-medium">标签名</th>
              <th className="text-left px-4 py-3 font-medium">Slug</th>
              <th className="text-left px-4 py-3 font-medium">文章数</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tags.map((tag) => (
              <tr key={tag.id}>
                <td className="px-4 py-3">{tag.name}</td>
                <td className="px-4 py-3 text-text-secondary font-mono text-xs">{tag.slug}</td>
                <td className="px-4 py-3 text-text-secondary">{tag._count.posts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

