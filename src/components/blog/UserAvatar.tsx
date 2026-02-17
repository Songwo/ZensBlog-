"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { AvatarWithBadge } from "@/components/blog/AvatarWithBadge";

export interface UserAvatarInfo {
  id: string;
  username?: string | null;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  bio?: string | null;
  activeBadgeId?: string | null;
  badges?: Array<{ id: string; name: string; icon: string; iconUrl?: string | null; color?: string }>;
}

export function UserAvatar({ user }: { user: UserAvatarInfo }) {
  const displayName = user.name || user.email || "开发者";
  const profileHref = user.username ? `/u/${user.username}` : "/profile";
  const activeBadge = user.badges?.find((badge) => badge.id === user.activeBadgeId) || user.badges?.[0];

  return (
    <div className="user-avatar-group relative">
      <button className="user-avatar-btn relative" aria-label="用户菜单">
        <AvatarWithBadge
          src={user.image}
          alt={displayName}
          fallbackText={displayName}
          sizeClassName="h-[34px] w-[34px]"
          badgeIcon={activeBadge?.icon}
          badgeIconUrl={activeBadge?.iconUrl}
          badgeColor={activeBadge?.color}
          badgeTitle={activeBadge?.name}
          badgeSizeClassName="h-5 w-5"
        />
      </button>

      <div className="user-avatar-card">
        <p className="text-sm font-semibold text-[#111111]">{displayName}</p>
        {user.email && <p className="text-xs text-[#64748b] mt-1">{user.email}</p>}
        {user.bio && <p className="text-xs text-[#64748b] mt-2 line-clamp-2">{user.bio}</p>}
        {activeBadge && (
          <p className="mt-2 text-xs text-[#475569]">
            当前徽章: <span className="font-medium">{activeBadge.icon} {activeBadge.name}</span>
          </p>
        )}
        {(user.badges?.length ?? 0) > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {user.badges!.slice(0, 4).map((badge) => (
              <span key={badge.id} className="text-[11px] rounded-full border border-[#e2e8f0] px-2 py-0.5 text-[#475569]">
                {badge.icon} {badge.name}
              </span>
            ))}
          </div>
        )}
        <div className="mt-3 flex gap-2">
          <Link href={profileHref} className="text-xs text-[#c73b78] hover:underline">我的主页</Link>
          <Link href="/settings/profile" className="text-xs text-[#64748b] hover:text-[#c73b78]">资料编辑</Link>
          <button onClick={() => signOut({ callbackUrl: "/" })} className="text-xs text-[#64748b] hover:text-[#c73b78]">
            退出
          </button>
        </div>
      </div>
    </div>
  );
}
