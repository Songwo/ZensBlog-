"use client";

import { useState } from "react";

type NowItem = {
  id: string;
  title: string;
  content: string;
  status: "计划中" | "进行中" | "已完成";
};

const statusOptions: Array<NowItem["status"]> = ["计划中", "进行中", "已完成"];

export function NowEditor({ initialItems }: { initialItems: NowItem[] }) {
  const [items, setItems] = useState<NowItem[]>(initialItems);
  const [saving, setSaving] = useState(false);

  function addItem() {
    setItems((prev) => [
      ...prev,
      { id: `now-${Date.now()}`, title: "", content: "", status: "计划中" },
    ]);
  }

  async function save() {
    setSaving(true);
    const res = await fetch("/api/now", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "保存失败");
    } else {
      alert("Now 页面内容已保存");
    }
    setSaving(false);
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">编辑 Now 条目</h2>
          <button type="button" onClick={addItem} className="text-sm text-accent">+ 添加</button>
        </div>
        {items.map((item, index) => (
          <div key={item.id} className="border border-border rounded-lg p-4 space-y-2">
            <input
              value={item.title}
              onChange={(e) => setItems((prev) => prev.map((x, i) => (i === index ? { ...x, title: e.target.value } : x)))}
              placeholder="标题"
              className="w-full px-3 py-2 text-sm rounded-md border border-border bg-bg-secondary"
            />
            <textarea
              value={item.content}
              onChange={(e) => setItems((prev) => prev.map((x, i) => (i === index ? { ...x, content: e.target.value } : x)))}
              placeholder="内容"
              rows={3}
              className="w-full px-3 py-2 text-sm rounded-md border border-border bg-bg-secondary"
            />
            <div className="flex items-center justify-between">
              <select
                value={item.status}
                onChange={(e) => setItems((prev) => prev.map((x, i) => (i === index ? { ...x, status: e.target.value as NowItem["status"] } : x)))}
                className="px-3 py-2 text-sm rounded-md border border-border bg-bg-secondary"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
                className="text-xs text-red-500"
              >
                删除
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-accent text-white text-sm disabled:opacity-50"
        >
          {saving ? "保存中..." : "保存并发布"}
        </button>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">预览</h2>
        <div className="space-y-3">
          {items.map((item) => (
            <article key={item.id} className="rounded-lg border border-border bg-bg-secondary p-4">
              <p className="text-xs text-accent mb-1">{item.status}</p>
              <h3 className="font-medium">{item.title || "未命名条目"}</h3>
              <p className="text-sm text-text-secondary mt-1">{item.content || "暂无内容"}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

