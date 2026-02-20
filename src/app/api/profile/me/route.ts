import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorJson, safeJson } from "@/lib/api";
import { getUserLevelInfo } from "@/lib/level";
import { awardBadgesForUser } from "@/lib/badges";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return errorJson("未授权", 401);
  await awardBadgesForUser(session.user.id);

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      username: true,
      name: true,
      image: true,
      bio: true,
      email: true,
      website: true,
      githubProfile: true,
      twitter: true,
      activeBadgeId: true,
      userBadges: { include: { badge: true }, orderBy: { awardedAt: "desc" }, take: 20 },
      posts: { where: { published: true }, select: { id: true, views: true } },
      comments: { where: { status: "APPROVED" }, select: { id: true } },
    },
  });
  if (!user) return errorJson("用户不存在", 404);
  const level = await getUserLevelInfo(user.id);

  return safeJson({
    profile: {
      id: user.id,
      username: user.username,
      name: user.name,
      image: user.image,
      bio: user.bio,
      email: user.email,
      website: user.website,
      githubProfile: user.githubProfile,
      twitter: user.twitter,
      activeBadgeId: user.activeBadgeId,
      badges: user.userBadges.map((item) => item.badge),
    },
    stats: {
      postCount: user.posts.length,
      commentCount: user.comments.length,
      viewCount: user.posts.reduce((sum, post) => sum + post.views, 0),
      readingMinutes: level.totalReadMinutes,
    },
    level,
  });
}
