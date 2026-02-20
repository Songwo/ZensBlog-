import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkRateLimit, errorJson, isSameOrigin, normalizeString, safeJson } from "@/lib/api";
import { updateUserCardSettings, updateUserPrivacySettings } from "@/lib/user-settings";
import { createSystemNotification } from "@/lib/notifications";

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return errorJson("未授权", 401);
  if (!isSameOrigin(request)) return errorJson("非法来源请求", 403);
  const rate = await checkRateLimit(request, { namespace: "api-me-profile", limit: 30, windowMs: 60_000 });
  if (!rate.allowed) return errorJson("请求过于频繁，请稍后再试", 429);

  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const data = {
      name: normalizeString(payload.name, 80) || null,
      username: normalizeString(payload.username, 40) || null,
      bio: normalizeString(payload.bio, 500),
      website: normalizeString(payload.website, 300) || null,
      twitter: normalizeString(payload.twitter, 120) || null,
      linkedin: normalizeString(payload.linkedin, 200) || null,
      activeBadgeId: normalizeString(payload.activeBadgeId, 64) || null,
    };
    if (data.username && !/^[a-zA-Z0-9_\\-]{2,30}$/.test(data.username)) {
      return errorJson("用户名格式不合法", 400);
    }

    const exists = data.username
      ? await prisma.user.findFirst({
          where: { username: data.username, id: { not: session.user.id } },
          select: { id: true },
        })
      : null;
    if (exists) return errorJson("用户名已被占用", 400);

    if (data.activeBadgeId) {
      const owns = await prisma.userBadge.findFirst({
        where: { userId: session.user.id, badgeId: data.activeBadgeId },
        select: { id: true },
      });
      if (!owns) return errorJson("只能佩戴已解锁徽章", 400);
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data,
    });

    await updateUserPrivacySettings(session.user.id, {
      showEmail: typeof payload.showEmail === "boolean" ? payload.showEmail : undefined,
      showSocialLinks: typeof payload.showSocialLinks === "boolean" ? payload.showSocialLinks : undefined,
    });
    await updateUserCardSettings(session.user.id, {
      backgroundStyle:
        payload.cardBackgroundStyle === "pink-glass" ||
        payload.cardBackgroundStyle === "ocean" ||
        payload.cardBackgroundStyle === "sunset" ||
        payload.cardBackgroundStyle === "night-grid"
          ? payload.cardBackgroundStyle
          : undefined,
      headline: normalizeString(payload.cardHeadline, 80),
      showBio: typeof payload.cardShowBio === "boolean" ? payload.cardShowBio : undefined,
      showStats: typeof payload.cardShowStats === "boolean" ? payload.cardShowStats : undefined,
      showSocial: typeof payload.cardShowSocial === "boolean" ? payload.cardShowSocial : undefined,
      showLevel: typeof payload.cardShowLevel === "boolean" ? payload.cardShowLevel : undefined,
      showBadge: typeof payload.cardShowBadge === "boolean" ? payload.cardShowBadge : undefined,
    });
    await createSystemNotification({
      userId: session.user.id,
      title: "个人资料已更新",
      body: "你的昵称、简介或隐私设置已成功保存。",
      targetUrl: "/settings/profile?tab=profile",
    });

    return safeJson({ success: true });
  } catch {
    return errorJson("保存失败", 500);
  }
}
