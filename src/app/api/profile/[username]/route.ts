import { prisma } from "@/lib/db";
import { errorJson, normalizeString, safeJson } from "@/lib/api";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;
  const normalized = normalizeString(username, 80);
  if (!normalized) return errorJson("用户名不合法", 400);

  const user = await prisma.user.findUnique({
    where: { username: normalized },
    select: {
      id: true,
      username: true,
      name: true,
      image: true,
      bio: true,
      website: true,
      githubProfile: true,
      twitter: true,
      posts: { where: { published: true }, select: { id: true, views: true } },
      comments: { where: { status: "APPROVED" }, select: { id: true } },
    },
  });
  if (!user) return errorJson("用户不存在", 404);

  return safeJson({
    profile: {
      id: user.id,
      username: user.username,
      name: user.name,
      image: user.image,
      bio: user.bio,
      website: user.website,
      githubProfile: user.githubProfile,
      twitter: user.twitter,
    },
    stats: {
      postCount: user.posts.length,
      commentCount: user.comments.length,
      viewCount: user.posts.reduce((sum, post) => sum + post.views, 0),
    },
  });
}

