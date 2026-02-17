"use client";

import clsx from "clsx";
import { AvatarWithBadge } from "@/components/blog/AvatarWithBadge";

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
};

export function AuthorMini({ name, image, title, badge, size = "sm", className }: AuthorMiniProps) {
  const isMd = size === "md";
  return (
    <div className={clsx("inline-flex items-center gap-2.5", className)}>
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
    </div>
  );
}
