"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const navItems = [
  { href: "/admin", label: "仪表盘", icon: "◆" },
  { href: "/admin/posts", label: "文章", icon: "文" },
  { href: "/admin/projects", label: "项目", icon: "项" },
  { href: "/admin/friends", label: "友链", icon: "友" },
  { href: "/admin/lab", label: "LAB", icon: "实" },
  { href: "/admin/now", label: "Now", icon: "今" },
  { href: "/admin/newsletter", label: "订阅", icon: "信" },
  { href: "/admin/categories", label: "分类", icon: "类" },
  { href: "/admin/comments", label: "评论", icon: "评" },
  { href: "/admin/settings", label: "设置", icon: "设" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="admin-sidebar w-56 min-h-screen flex flex-col">
      <div className="p-4 border-b border-border">
        <Link href="/admin" className="font-heading text-lg font-bold">
          Zen&apos;s Blog
        </Link>
        <p className="text-xs text-text-secondary mt-0.5">管理后台</p>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const active = item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                active
                  ? "bg-accent/10 text-accent font-medium"
                  : "text-text-secondary hover:text-text hover:bg-bg"
              }`}
            >
              <span className="text-xs">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-border">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-text rounded-md hover:bg-bg transition-colors"
        >
          ← 返回前台
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/auth/signin" })}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-accent rounded-md hover:bg-bg transition-colors"
        >
          退出登录
        </button>
      </div>
    </aside>
  );
}
