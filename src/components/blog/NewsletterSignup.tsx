"use client";

import { useState } from "react";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setMessage("");

    const res = await fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), source: "home" }),
    });

    if (res.ok) {
      setMessage("订阅成功，感谢关注。");
      setEmail("");
    } else {
      const data = await res.json();
      setMessage(data.error || "订阅失败，请稍后重试。");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={subscribe} className="mt-8 rounded-xl border border-[#eceff5] bg-white/70 p-4 backdrop-blur-md">
      <p className="text-sm font-medium text-[#141414]">Newsletter 订阅</p>
      <p className="text-xs text-[#64748b] mt-1">输入邮箱，接收更新通知（低频）。</p>
      <div className="mt-3 flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="flex-1 px-3 py-2 rounded-md text-sm border border-[#e2e8f0]"
        />
        <button type="submit" disabled={loading} className="px-3 py-2 rounded-md text-sm bg-accent text-white disabled:opacity-50">
          {loading ? "提交中..." : "订阅"}
        </button>
      </div>
      {message && <p className="mt-2 text-xs text-[#64748b]">{message}</p>}
    </form>
  );
}

