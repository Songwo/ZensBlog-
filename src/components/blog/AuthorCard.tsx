"use client";

import { AuthorMini } from "@/components/blog/AuthorMini";
import type { ReactNode } from "react";

type AuthorCardProps = {
  name: string;
  username?: string | null;
  image?: string | null;
  title?: string | null;
  bio?: string | null;
  badge?: {
    id: string;
    name: string;
    icon: string;
    iconUrl: string | null;
    color: string;
  } | null;
  stats?: Array<{ label: string; value: number | string }>;
  actions?: ReactNode;
  variant?: "default" | "compact";
  className?: string;
};

export function AuthorCard({
  name,
  username,
  image,
  title,
  bio,
  badge,
  stats,
  actions,
  variant = "default",
  className,
}: AuthorCardProps) {
  const compact = variant === "compact";
  return (
    <div className={className}>
      <AuthorMini
        name={name}
        username={username}
        image={image}
        title={title}
        badge={badge}
        size={compact ? "sm" : "md"}
        enablePreview
      />
      {!compact && username ? <p className="mt-1 text-xs text-[#64748b]">@{username}</p> : null}
      {bio ? <p className="mt-3 text-sm text-[#64748b]">{bio}</p> : null}
      {stats && stats.length > 0 ? (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {stats.map((item) => (
            <div key={item.label} className="rounded-md border border-[#e2e8f0] bg-white/60 px-2 py-1.5 text-center">
              <p className="text-[11px] text-[#64748b]">{item.label}</p>
              <p className="text-sm font-semibold text-[#111111]">{item.value}</p>
            </div>
          ))}
        </div>
      ) : null}
      {actions ? <div className="mt-3 flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
