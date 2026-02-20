"use client";

import Link from "next/link";
import clsx from "clsx";
import { AvatarWithBadge } from "@/components/blog/AvatarWithBadge";

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

export function UserQuickCard({
  data,
  className,
}: {
  data: PreviewPayload;
  className?: string;
}) {
  const bgClass = `quick-card-bg-${data.card.backgroundStyle}`;
  const socialVisible = data.card.showSocial && data.privacy.showSocialLinks;

  return (
    <div className={clsx("user-quick-card", bgClass, className)}>
      <div className="flex items-start gap-3">
        <AvatarWithBadge
          src={data.profile.image}
          alt={data.profile.name}
          fallbackText={data.profile.name}
          sizeClassName="h-12 w-12"
          badgeIcon={data.card.showBadge ? data.badge?.icon : null}
          badgeIconUrl={data.card.showBadge ? data.badge?.iconUrl : null}
          badgeColor={data.card.showBadge ? data.badge?.color : null}
          badgeTitle={data.card.showBadge ? data.badge?.name : null}
          badgeSizeClassName="h-5 w-5"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[#111111]">{data.profile.name}</p>
          <p className="mt-0.5 text-xs text-[#475569]">@{data.profile.username}</p>
          {data.card.headline ? <p className="mt-1.5 text-xs text-[#334155]">{data.card.headline}</p> : null}
        </div>
      </div>

      {data.card.showBio && data.profile.bio ? (
        <p className="mt-3 line-clamp-3 text-xs leading-5 text-[#334155]">{data.profile.bio}</p>
      ) : null}

      {data.card.showLevel ? (
        <p className="mt-2 text-[11px] text-[#334155]">
          {data.level.levelName} Lv.{data.level.level} · 积分 {data.level.points} · 连续阅读 {data.stats.daysRead} 天
        </p>
      ) : null}

      {data.card.showStats ? (
        <div className="mt-3 grid grid-cols-4 gap-2 text-center">
          <Stat label="文章" value={data.stats.posts} />
          <Stat label="评论" value={data.stats.comments} />
          <Stat label="点赞" value={data.stats.likesReceived} />
          <Stat label="阅读" value={data.stats.views} />
        </div>
      ) : null}

      {socialVisible ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {data.profile.githubProfile ? <LinkChip href={data.profile.githubProfile}>GitHub</LinkChip> : null}
          {data.profile.twitter ? <LinkChip href={data.profile.twitter}>Twitter/X</LinkChip> : null}
          {data.profile.website ? <LinkChip href={data.profile.website}>网站</LinkChip> : null}
        </div>
      ) : null}

      {data.card.showBadge && data.badge ? (
        <p className="mt-3 text-xs text-[#334155]">
          当前徽章: <span className="font-medium">{data.badge.icon} {data.badge.name}</span>
        </p>
      ) : null}

      <div className="mt-3">
        <Link href={`/u/${encodeURIComponent(data.profile.username)}`} className="text-xs font-medium text-[#a61e5d] hover:underline">
          访问主页
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-white/60 bg-white/55 px-1.5 py-1">
      <p className="text-[10px] text-[#64748b]">{label}</p>
      <p className="text-[11px] font-semibold text-[#0f172a]">{value}</p>
    </div>
  );
}

function LinkChip({ href, children }: { href: string; children: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="rounded-full border border-white/70 bg-white/60 px-2.5 py-1 text-[11px] text-[#334155] hover:border-[#f05d9a] hover:text-[#a61e5d]"
    >
      {children}
    </a>
  );
}

