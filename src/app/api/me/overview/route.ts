import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorJson, safeJson } from "@/lib/api";
import { awardBadgesForUser } from "@/lib/badges";
import {
  getUserCardSettings,
  getUserIntegrationState,
  getUserNotifyPreferences,
  getUserNotifySettings,
  getUserPrivacySettings,
  getUserTwoFactorSettings,
  touchUserSessionActivity,
} from "@/lib/user-settings";
import { getUserLevelInfo } from "@/lib/level";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return errorJson("未授权", 401);
  await awardBadgesForUser(session.user.id);

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      image: true,
      bio: true,
      website: true,
      twitter: true,
      linkedin: true,
      githubProfile: true,
      activeBadgeId: true,
      createdAt: true,
      userBadges: { include: { badge: true }, orderBy: { awardedAt: "desc" }, take: 30 },
      _count: { select: { posts: true, comments: true, likes: true } },
      accounts: { select: { provider: true, providerAccountId: true } },
    },
  });
  if (!user) return errorJson("用户不存在", 404);

  const [notifySettings, notifyPrefs, privacy, card, twoFactor, viewsAggregate, sessionInfo, levelInfo] = await Promise.all([
    getUserNotifySettings(user.id),
    getUserNotifyPreferences(user.id),
    getUserPrivacySettings(user.id),
    getUserCardSettings(user.id),
    getUserTwoFactorSettings(user.id),
    prisma.post.aggregate({
      where: { authorId: user.id },
      _sum: { views: true },
    }),
    touchUserSessionActivity(user.id, request),
    getUserLevelInfo(user.id),
  ]);

  const integrationState = await getUserIntegrationState(user.id, {
    github: user.accounts.some((a) => a.provider === "github"),
    google: user.accounts.some((a) => a.provider === "google"),
  });

  return safeJson({
    profile: {
      id: user.id,
      name: user.name || "",
      username: user.username || "",
      email: user.email || "",
      image: user.image || "",
      bio: user.bio || "",
      website: user.website || "",
      twitter: user.twitter || "",
      linkedin: user.linkedin || "",
      githubProfile: user.githubProfile || "",
      activeBadgeId: user.activeBadgeId || "",
      createdAt: user.createdAt,
    },
    badges: user.userBadges.map((item) => item.badge),
    level: levelInfo,
    stats: {
      posts: user._count.posts,
      comments: user._count.comments,
      likes: user._count.likes,
      views: viewsAggregate._sum.views || 0,
      readingMinutes: levelInfo.totalReadMinutes,
    },
    settings: {
      notify: notifySettings,
      preferences: notifyPrefs,
      privacy,
      card,
      auth: { twoFactorEnabled: twoFactor.enabled },
    },
    sessions: sessionInfo.sessions,
    currentSessionId: sessionInfo.currentSessionId,
    integrations: integrationState,
  });
}
