"use client";

import { useState } from "react";

const ISSUE_BASE = "https://github.com/yourname/zensblog/issues/new";

export function LabSuggestionBox() {
  const [text, setText] = useState("");

  function submitSuggestion(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim() || "我想看一个新的实验 Demo：";
    const url = `${ISSUE_BASE}?title=${encodeURIComponent("Lab 实验建议")}&body=${encodeURIComponent(body)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="mt-10 rounded-xl border border-[#eceff5] bg-white/60 p-6">
      <h2 className="text-xl font-semibold text-[#141414] mb-2">提交实验建议</h2>
      <p className="text-sm text-[#64748b] mb-3">写下你想看的实验方向，我会自动带你去 GitHub Issue 创建建议。</p>
      <form onSubmit={submitSuggestion} className="flex flex-col gap-2 sm:flex-row">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="例如：想看 A* 路径搜索可视化 / Framer Motion 手势实验"
          className="flex-1 rounded-md border border-[#e2e8f0] px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-md bg-accent px-4 py-2 text-sm text-white hover:opacity-90 transition-opacity"
        >
          提交到 GitHub
        </button>
      </form>
    </div>
  );
}

