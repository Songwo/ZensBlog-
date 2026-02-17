"use client";

import Image from "next/image";
import clsx from "clsx";

type AvatarWithBadgeProps = {
  src?: string | null;
  alt: string;
  fallbackText?: string;
  sizeClassName?: string;
  className?: string;
  badgeIcon?: string | null;
  badgeIconUrl?: string | null;
  badgeColor?: string | null;
  badgeTitle?: string | null;
  badgeSizeClassName?: string;
};

export function AvatarWithBadge({
  src,
  alt,
  fallbackText,
  sizeClassName = "h-10 w-10",
  className,
  badgeIcon,
  badgeIconUrl,
  badgeColor,
  badgeTitle,
  badgeSizeClassName = "h-5 w-5",
}: AvatarWithBadgeProps) {
  const text = (fallbackText || alt || "U").slice(0, 1).toUpperCase();
  const hasBadge = Boolean(badgeIcon || badgeIconUrl);

  return (
    <div className={clsx("relative inline-flex shrink-0 overflow-visible", sizeClassName, className)}>
      <div className="h-full w-full overflow-hidden rounded-full border border-slate-200 bg-slate-100">
        {src ? (
          <Image src={src} alt={alt} width={256} height={256} className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-slate-600">{text}</span>
        )}
      </div>

      {hasBadge && (
        <span
          className={clsx(
            "absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 rounded-full border-2 border-white shadow-sm flex items-center justify-center",
            badgeSizeClassName
          )}
          style={{ backgroundColor: badgeColor || "#16a34a" }}
          title={badgeTitle || "徽章"}
        >
          {badgeIconUrl ? (
            <Image src={badgeIconUrl} alt={badgeTitle || "badge"} width={16} height={16} className="h-3.5 w-3.5 rounded-full object-cover" />
          ) : (
            <span className="text-[11px] leading-none text-white">{badgeIcon || "🍃"}</span>
          )}
        </span>
      )}
    </div>
  );
}
