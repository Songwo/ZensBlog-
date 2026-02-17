import { prisma } from "@/lib/db";

const DEFAULT_BADGES = [
  { name: "Newbie", icon: "🌱", color: "#22c55e", description: "首次登录", condition: "登录一次" },
  { name: "Writer", icon: "✍️", color: "#3b82f6", description: "发布 5 篇文章", condition: "文章数 >= 5" },
  { name: "Popular", icon: "🔥", color: "#f97316", description: "收到 50 个点赞", condition: "收到点赞 >= 50" },
  { name: "Comment King", icon: "💬", color: "#a855f7", description: "活跃评论者", condition: "评论数 >= 20" },
  { name: "GitHub Connected", icon: "🐙", color: "#111827", description: "已同步 GitHub", condition: "GitHub 资料同步成功" },
] as const;

export async function ensureDefaultBadges() {
  for (const badge of DEFAULT_BADGES) {
    await prisma.badge.upsert({
      where: { name: badge.name },
      update: {
        icon: badge.icon,
        color: badge.color,
        description: badge.description,
        condition: badge.condition,
      },
      create: {
        name: badge.name,
        icon: badge.icon,
        color: badge.color,
        description: badge.description,
        condition: badge.condition,
      },
    });
  }
}

async function grantBadge(userId: string, badgeName: string) {
  const badge = await prisma.badge.findUnique({
    where: { name: badgeName },
    select: { id: true },
  });
  if (!badge) return;

  await prisma.userBadge.upsert({
    where: { userId_badgeId: { userId, badgeId: badge.id } },
    update: {},
    create: { userId, badgeId: badge.id },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { activeBadgeId: true },
  });
  if (!user?.activeBadgeId && badgeName === "Newbie") {
    await prisma.user.update({
      where: { id: userId },
      data: { activeBadgeId: badge.id },
    });
  }
}

export async function awardBadgesForUser(userId: string) {
  await ensureDefaultBadges();
  const [postCount, commentCount, receivedLikes, user] = await Promise.all([
    prisma.post.count({ where: { authorId: userId } }),
    prisma.comment.count({ where: { userId } }),
    prisma.postLike.count({ where: { post: { authorId: userId } } }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { githubId: true, githubSyncedAt: true },
    }),
  ]);

  await grantBadge(userId, "Newbie");
  if (postCount >= 5) await grantBadge(userId, "Writer");
  if (receivedLikes >= 50) await grantBadge(userId, "Popular");
  if (commentCount >= 20) await grantBadge(userId, "Comment King");
  if (user?.githubId && user?.githubSyncedAt) await grantBadge(userId, "GitHub Connected");
}
