"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Category {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  _count: { posts: number };
}

export function CategoryManager({ categories: initial }: { categories: Category[] }) {
  const router = useRouter();
  const [categories, setCategories] = useState(initial);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;
    setSaving(true);

    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug, sortOrder: categories.length }),
    });

    if (res.ok) {
      setName("");
      setSlug("");
      router.refresh();
      const data = await res.json();
      setCategories([...categories, { ...data, _count: { posts: 0 } }]);
    } else {
      const data = await res.json();
      alert(data.error);
    }
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleAdd} className="flex items-end gap-3">
        <div>
          <label className="block text-sm font-medium mb-1.5">名称</label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSlug(e.target.value.toLowerCase().replace(/[^\w\u4e00-\u9fff]+/g, "-").replace(/^-|-$/g, ""));
            }}
            className="px-3 py-2 bg-bg-secondary border border-border rounded-md text-sm focus:outline-none focus:border-accent"
            placeholder="分类名称"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Slug</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="px-3 py-2 bg-bg-secondary border border-border rounded-md text-sm font-mono focus:outline-none focus:border-accent"
            placeholder="slug"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-accent text-white text-sm rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          添加
        </button>
      </form>

      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-secondary">
              <th className="text-left px-4 py-3 font-medium">名称</th>
              <th className="text-left px-4 py-3 font-medium">Slug</th>
              <th className="text-left px-4 py-3 font-medium">文章数</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {categories.map((cat) => (
              <tr key={cat.id}>
                <td className="px-4 py-3">{cat.name}</td>
                <td className="px-4 py-3 text-text-secondary font-mono text-xs">{cat.slug}</td>
                <td className="px-4 py-3 text-text-secondary">{cat._count.posts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
