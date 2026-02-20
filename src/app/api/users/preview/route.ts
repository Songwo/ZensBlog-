import { prisma } from "@/lib/db";
import { errorJson, normalizeString, safeJson } from "@/lib/api";
import { getUserCardSettings, getUserPrivacySettings } from "@/lib/user-settings";
import { getUserLevelInfo } from "@/lib/level";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = normalizeString(searchParams.get("username"), 80);
  if (!username) return errorJson("缺少用户名", 400);

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      name: true,
      image: true,
      bio: true,
      website: true,
      twitter: true,
      githubProfile: true,
      activeBadge: {
        select: { id: true, name: true, icon: true, iconUrl: true, color: true },
      },
      _count: {
        select: {
          posts: true,
          comments: true,
        },
      },
    },
  });
  if (!user) return errorJson("用户不存在", 404);

  const [card, privacy, levelInfo, viewSum] = await Promise.all([
    getUserCardSettings(user.id),
    getUserPrivacySettings(user.id),
    getUserLevelInfo(user.id),
    prisma.post.aggregate({
      where: { authorId: user.id, published: true, status: "PUBLISHED" },
      _sum: { views: true },
    }),
  ]);

  return safeJson({
    profile: {
      username: user.username || "",
      name: user.name || user.username || "用户",
      image: user.image || "",
      bio: user.bio || "",
      website: user.website || "",
      twitter: user.twitter || "",
      githubProfile: user.githubProfile || "",
    },
    badge: card.showBadge ? user.activeBadge : null,
    card,
    privacy,
    stats: {
      posts: user._count.posts,
      comments: user._count.comments,
      views: viewSum._sum.views || 0,
      likesReceived: levelInfo.likesReceived,
      daysRead: levelInfo.daysRead,
    },
    level: {
      level: levelInfo.level,
      levelName: levelInfo.levelName,
      points: levelInfo.points,
    },
  });
}
