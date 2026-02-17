"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";

type NotificationItem = {
  id: string;
  type: "LIKE" | "COMMENT_REPLY" | "MESSAGE";
  title: string;
  body: string;
  targetUrl: string | null;
  readAt: string | null;
  createdAt: string;
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState<NotificationItem[]>([]);

  async function loadNotifications() {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) return;
      setUnreadCount(data.unreadCount || 0);
      setItems(Array.isArray(data.notifications) ? data.notifications : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
    const timer = setInterval(loadNotifications, 30_000);
    return () => clearInterval(timer);
  }, []);

  async function markRead(id: string) {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
    setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() })));
    setUnreadCount(0);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next) loadNotifications();
        }}
        className="relative h-9 w-9 rounded-full border border-[#e2e8f0] bg-white/80 flex items-center justify-center hover:bg-white"
        aria-label="通知中心"
      >
        <Bell size={17} className="text-[#334155]" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 min-w-5 h-5 rounded-full bg-red-500 text-white text-[11px] leading-5 px-1 text-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[340px] rounded-xl border border-[#e2e8f0] bg-white shadow-lg z-[80]">
          <div className="px-3 py-2 border-b border-[#eef2f7] flex items-center justify-between">
            <p className="text-sm font-semibold text-[#0f172a]">通知中心</p>
            <button type="button" onClick={markAllRead} className="text-xs text-[#475569] hover:text-[#111827]">
              全部已读
            </button>
          </div>
          <div className="max-h-[360px] overflow-auto">
            {loading ? (
              <p className="px-3 py-4 text-sm text-[#64748b]">加载中...</p>
            ) : items.length === 0 ? (
              <p className="px-3 py-4 text-sm text-[#64748b]">暂无通知</p>
            ) : (
              items.map((item) => {
                const content = (
                  <div className={`px-3 py-3 border-b border-[#f1f5f9] hover:bg-[#f8fafc] ${!item.readAt ? "bg-[#f8fbff]" : ""}`}>
                    <p className="text-sm font-medium text-[#0f172a]">{item.title}</p>
                    {item.body && <p className="text-xs text-[#64748b] mt-1 line-clamp-2">{item.body}</p>}
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[11px] text-[#94a3b8]">{new Date(item.createdAt).toLocaleString("zh-CN")}</span>
                      {!item.readAt && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            markRead(item.id);
                          }}
                          className="text-[11px] text-[#2563eb]"
                        >
                          标记已读
                        </button>
                      )}
                    </div>
                  </div>
                );
                if (!item.targetUrl) return <div key={item.id}>{content}</div>;
                return (
                  <Link key={item.id} href={item.targetUrl} onClick={() => setOpen(false)}>
                    {content}
                  </Link>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
