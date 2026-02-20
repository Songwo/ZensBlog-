"use client";

import { useEffect, useState } from "react";
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

let profileCache: UserAvatarInfo | null = null;
let profileCacheAt = 0;
const PROFILE_CACHE_TTL = 60_000;

export function UserAvatar({ user }: { user: UserAvatarInfo }) {
  const [latest, setLatest] = useState<UserAvatarInfo>(() => {
    if (profileCache && Date.now() - profileCacheAt < PROFILE_CACHE_TTL) {
      return { ...user, ...profileCache };
    }
    return user;
  });

  useEffect(() => {
    if (profileCache && Date.now() - profileCacheAt < PROFILE_CACHE_TTL) return;
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/profile/me");
        const data = (await res.json()) as { profile?: UserAvatarInfo };
        if (!mounted || !res.ok || !data.profile) return;
        profileCache = data.profile;
        profileCacheAt = Date.now();
        setLatest((prev) => ({
          ...prev,
          ...data.profile,
        }));
      } catch {
        // ignore sync failures
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const displayName = latest.name || latest.email || "开发者";
  const profileHref = latest.username ? `/u/${latest.username}` : "/profile";
  const activeBadge = latest.badges?.find((badge) => badge.id === latest.activeBadgeId) || latest.badges?.[0];

  return (
    <div className="user-avatar-group relative">
      <button className="user-avatar-btn relative" aria-label="用户菜单">
        <AvatarWithBadge
          src={latest.image}
          alt={displayName}
          fallbackText={displayName}
          sizeClassName="h-[40px] w-[40px]"
          badgeIcon={activeBadge?.icon}
          badgeIconUrl={activeBadge?.iconUrl}
          badgeColor={activeBadge?.color}
          badgeTitle={activeBadge?.name}
          badgeSizeClassName="h-5 w-5"
        />
      </button>

      <div className="user-avatar-card">
        <p className="text-sm font-semibold text-[#111111]">{displayName}</p>
        {latest.email && <p className="text-xs text-[#64748b] mt-1">{latest.email}</p>}
        {latest.bio && <p className="text-xs text-[#64748b] mt-2 line-clamp-2">{latest.bio}</p>}
        {activeBadge && (
          <p className="mt-2 text-xs text-[#475569]">
            当前徽章: <span className="font-medium">{activeBadge.icon} {activeBadge.name}</span>
          </p>
        )}
        {(latest.badges?.length ?? 0) > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {latest.badges!.slice(0, 4).map((badge) => (
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
