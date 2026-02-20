"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { AvatarWithBadge } from "@/components/blog/AvatarWithBadge";
import { UserQuickCard } from "@/components/blog/UserQuickCard";

type BadgeInfo = {
  id: string;
  name: string;
  icon: string;
  iconUrl: string | null;
  color: string;
} | null;

type AuthorMiniProps = {
  name: string;
  username?: string | null;
  image?: string | null;
  title?: string | null;
  badge?: BadgeInfo;
  size?: "sm" | "md";
  className?: string;
  enablePreview?: boolean;
};

type PreviewPayload = {
  profile: {
    username: string;
    name: string;
    image: string;
    bio: string;
    website: string;
    twitter: string;
    githubProfile: string;
  };
  badge: { id: string; name: string; icon: string; iconUrl: string | null; color: string } | null;
  card: {
    backgroundStyle: "pink-glass" | "ocean" | "sunset" | "night-grid";
    headline: string;
    showBio: boolean;
    showStats: boolean;
    showSocial: boolean;
    showLevel: boolean;
    showBadge: boolean;
  };
  privacy: { showSocialLinks: boolean };
  stats: { posts: number; comments: number; views: number; likesReceived: number; daysRead: number };
  level: { level: number; levelName: string; points: number };
};

const previewCache = new Map<string, PreviewPayload>();

export function AuthorMini({ name, username, image, title, badge, size = "sm", className, enablePreview = false }: AuthorMiniProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewPayload | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const isMd = size === "md";
  const canPreview = Boolean(enablePreview && username);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (event: MouseEvent) => {
      if (!hostRef.current) return;
      if (!hostRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("keydown", onEsc);
    return () => {
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  async function togglePreview() {
    if (!canPreview) return;
    const next = !open;
    setOpen(next);
    if (!next) return;
    if (!username) return;
    const key = username.toLowerCase();
    const cached = previewCache.get(key);
    if (cached) {
      setPreview(cached);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/users/preview?username=${encodeURIComponent(username)}`, { cache: "no-store" });
      const data = (await res.json()) as PreviewPayload;
      if (!res.ok) return;
      previewCache.set(key, data);
      setPreview(data);
    } finally {
      setLoading(false);
    }
  }

  const content = useMemo(
    () => (
      <>
        <AvatarWithBadge
          src={image}
          alt={name}
          fallbackText={name}
          sizeClassName={isMd ? "h-10 w-10" : "h-7 w-7"}
          badgeIcon={badge?.icon}
          badgeIconUrl={badge?.iconUrl}
          badgeColor={badge?.color}
          badgeTitle={badge?.name || null}
          badgeSizeClassName={isMd ? "h-5 w-5" : "h-4 w-4"}
        />
        <span className="inline-flex items-center gap-1.5">
          <span className={isMd ? "text-sm font-medium text-[#111111]" : "text-xs text-[#111111]"}>{name}</span>
          {title ? <span className="text-xs text-[#64748b]">· {title}</span> : null}
        </span>
      </>
    ),
    [badge?.color, badge?.icon, badge?.iconUrl, badge?.name, image, isMd, name, title]
  );

  if (!canPreview) {
    return <div className={clsx("inline-flex items-center gap-2.5", className)}>{content}</div>;
  }

  return (
    <div ref={hostRef} className={clsx("relative inline-flex items-center", className)}>
      <button
        type="button"
        className="inline-flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f05d9a]/45"
        onClick={() => void togglePreview()}
      >
        {content}
      </button>
      {open && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-[65] w-[320px] max-w-[84vw]">
          {preview ? (
            <UserQuickCard data={preview} />
          ) : (
            <div className="user-quick-card quick-card-bg-pink-glass">
              <p className="text-xs text-[#475569]">{loading ? "加载中..." : "暂时无法加载预览"}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
