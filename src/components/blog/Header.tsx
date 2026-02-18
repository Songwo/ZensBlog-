"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { ThemeSwitcher } from "@/components/blog/ThemeSwitcher";
import { UserAvatar } from "@/components/blog/UserAvatar";
import { NotificationBell } from "@/components/blog/NotificationBell";

export function Header({ siteName }: { siteName: string }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: session } = useSession();

  const navLinks = [
    { href: "/blog", label: "文章" },
    { href: "/community", label: "社区" },
    { href: "/lab", label: "LAB" },
    { href: "/projects", label: "项目" },
    { href: "/friends", label: "友链" },
    { href: "/now", label: "Now" },
    { href: "/archives", label: "归档" },
    { href: "/about", label: "关于" },
  ];

  const isActive = (href: string) => {
    if (href === "/blog") {
      return pathname === "/blog" || pathname?.startsWith("/blog/");
    }
    if (href === "/community") {
      return pathname === "/community" || pathname?.startsWith("/community/");
    }
    return pathname === href;
  };

  return (
    <header className="zen-header">
      <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-8 lg:px-12 h-16 flex items-center justify-between">
        <Link href="/" className="zen-brand text-xl relative z-50 max-w-[48vw] truncate">
          {siteName}
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`zen-nav-link nav-link-enhanced relative transition-colors duration-300 ${
                isActive(link.href) ? "text-[#f05d9a]" : ""
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {session?.user ? (
            <>
              <Link href="/settings/profile/posts/new" className="theme-switch-btn">
                写文章
              </Link>
              <Link href="/community/new" className="theme-switch-btn">
                发帖子
              </Link>
              <NotificationBell />
              <UserAvatar
                user={{
                  id: session.user.id,
                  username: session.user.username,
                  name: session.user.name,
                  email: session.user.email,
                  image: session.user.image,
                  activeBadgeId: session.user.activeBadgeId,
                  badges: session.user.badges?.map((b) => ({
                    id: b.id,
                    name: b.name,
                    icon: b.icon,
                    iconUrl: b.iconUrl,
                    color: b.color,
                  })),
                }}
              />
            </>
          ) : (
            <Link href="/auth/signin" className="theme-switch-btn">登录</Link>
          )}
          <ThemeSwitcher />
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden relative z-50 w-8 h-8 flex flex-col items-center justify-center gap-1.5"
          aria-label="Toggle menu"
        >
          <span
            className={`w-5 h-0.5 bg-[#2f3139] transition-all duration-300 ${
              mobileMenuOpen ? "rotate-45 translate-y-2" : ""
            }`}
          />
          <span
            className={`w-5 h-0.5 bg-[#2f3139] transition-all duration-300 ${
              mobileMenuOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`w-5 h-0.5 bg-[#2f3139] transition-all duration-300 ${
              mobileMenuOpen ? "-rotate-45 -translate-y-2" : ""
            }`}
          />
        </button>

        {/* Mobile Navigation */}
        <div
          className={`md:hidden fixed inset-0 z-40 transition-all duration-300 ${
            mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-white/80 backdrop-blur-md"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Menu */}
          <nav
            className={`absolute top-16 left-0 right-0 bg-white/90 backdrop-blur-xl border-b border-[#eceff5] shadow-[0_8px_32px_rgba(240,93,154,0.1)] transition-transform duration-300 ${
              mobileMenuOpen ? "translate-y-0" : "-translate-y-full"
            }`}
          >
            <div className="mx-auto w-full max-w-[1280px] px-4 py-6 flex flex-col gap-4">
              {!session?.user ? (
                <Link href="/auth/signin" onClick={() => setMobileMenuOpen(false)} className="text-base py-2 text-[#2f3139] hover:text-[#f05d9a]">
                  登录
                </Link>
              ) : (
                <>
                  <Link href="/settings/profile/posts/new" onClick={() => setMobileMenuOpen(false)} className="text-base py-2 text-[#2f3139] hover:text-[#f05d9a]">
                    写文章
                  </Link>
                  <Link href="/community/new" onClick={() => setMobileMenuOpen(false)} className="text-base py-2 text-[#2f3139] hover:text-[#f05d9a]">
                    发帖子
                  </Link>
                  <Link href="/settings/profile" onClick={() => setMobileMenuOpen(false)} className="text-base py-2 text-[#2f3139] hover:text-[#f05d9a]">
                    个人设置
                  </Link>
                  <Link href="/settings/profile?tab=messages" onClick={() => setMobileMenuOpen(false)} className="text-base py-2 text-[#2f3139] hover:text-[#f05d9a]">
                    私信收件箱
                  </Link>
                </>
              )}
              <ThemeSwitcher />
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-base py-2 transition-colors duration-300 ${
                    isActive(link.href)
                      ? "text-[#f05d9a] font-medium"
                      : "text-[#2f3139] hover:text-[#f05d9a]"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
