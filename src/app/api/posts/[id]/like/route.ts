import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkRateLimit, errorJson, isSameOrigin, safeJson } from "@/lib/api";
import { createNotification } from "@/lib/notifications";
import { awardBadgesForUser } from "@/lib/badges";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, { params }: RouteContext) {
  const { id } = await params;
  const post = await prisma.post.findUnique({
    where: { id },
    select: { id: true, _count: { select: { likes: true } } },
  });
  if (!post) return errorJson("文章不存在", 404);

  const session = await auth();
  if (!session?.user?.id) {
    return safeJson({ liked: false, count: post._count.likes });
  }

  const like = await prisma.postLike.findUnique({
    where: { userId_postId: { userId: session.user.id, postId: id } },
    select: { id: true },
  });
  return safeJson({ liked: Boolean(like), count: post._count.likes });
}

export async function POST(request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return errorJson("请先登录", 401);
  if (!isSameOrigin(request)) return errorJson("非法来源请求", 403);

  const rate = await checkRateLimit(request, { namespace: "api-post-like", limit: 60, windowMs: 60_000 });
  if (!rate.allowed) return errorJson("请求过于频繁，请稍后再试", 429);

  const { id } = await params;
  const post = await prisma.post.findUnique({
    where: { id },
    select: { id: true, _count: { select: { likes: true } } },
  });
  if (!post) return errorJson("文章不存在", 404);

  const existing = await prisma.postLike.findUnique({
    where: { userId_postId: { userId: session.user.id, postId: id } },
    select: { id: true },
  });

  if (existing) {
    await prisma.postLike.delete({ where: { id: existing.id } });
    const count = await prisma.postLike.count({ where: { postId: id } });
    await awardBadgesForUser(session.user.id);
    return safeJson({ liked: false, count });
  }

  await prisma.postLike.create({
    data: {
      userId: session.user.id,
      postId: id,
    },
  });
  const postAuthor = await prisma.post.findUnique({
    where: { id },
    select: { authorId: true, title: true, slug: true, type: true },
  });
  if (postAuthor?.authorId) {
    await createNotification({
      userId: postAuthor.authorId,
      actorId: session.user.id,
      type: "LIKE",
      title: "你的文章收到了新的点赞",
      body: postAuthor.title,
      targetId: id,
      targetUrl: postAuthor.type === "COMMUNITY" ? `/community/${postAuthor.slug}` : `/blog/${postAuthor.slug}`,
    });
  }
  const count = await prisma.postLike.count({ where: { postId: id } });
  await awardBadgesForUser(session.user.id);
  if (postAuthor?.authorId) await awardBadgesForUser(postAuthor.authorId);
  return safeJson({ liked: true, count });
}
