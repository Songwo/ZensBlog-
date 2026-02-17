"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Config {
  key: string;
  value: string;
}

export function SettingsForm({ configs }: { configs: Config[] }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    const map: Record<string, string> = {};
    for (const c of configs) map[c.key] = c.value;
    setForm(map);
  }, [configs]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      router.refresh();
    } else {
      alert("保存失败");
    }
    setSaving(false);
  }

  const fields = [
    { key: "siteName", label: "站点名称" },
    { key: "siteDescription", label: "站点描述" },
    { key: "siteUrl", label: "站点 URL" },
    { key: "authorName", label: "作者名称" },
  ];

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      {fields.map((field) => (
        <div key={field.key}>
          <label className="block text-sm font-medium mb-1.5">{field.label}</label>
          <input
            type="text"
            value={form[field.key] || ""}
            onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
            className="w-full px-3 py-2.5 bg-bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:border-accent"
          />
        </div>
      ))}
      <div>
        <label className="block text-sm font-medium mb-1.5">动效强度</label>
        <select
          value={form.effectsLevel || "medium"}
          onChange={(e) => setForm({ ...form, effectsLevel: e.target.value })}
          className="w-full px-3 py-2.5 bg-bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:border-accent"
        >
          <option value="low">Low（低动效）</option>
          <option value="medium">Medium（推荐）</option>
          <option value="ultra">Ultra（高动效）</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={saving}
        className="px-6 py-2.5 bg-accent text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {saving ? "保存中..." : "保存设置"}
      </button>
    </form>
  );
}
