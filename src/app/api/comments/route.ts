import { prisma } from "@/lib/db";
import { checkRateLimit, errorJson, normalizeString, safeJson } from "@/lib/api";
import { auth } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { awardBadgesForUser } from "@/lib/badges";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return errorJson("请先登录后再评论", 401);

  const rate = await checkRateLimit(request, { namespace: "api-comments-create", limit: 8, windowMs: 10 * 60_000 });
  if (!rate.allowed) return errorJson("评论过于频繁，请稍后再试", 429);

  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const postId = typeof payload.postId === "string" ? payload.postId.trim() : "";
    const parentId = typeof payload.parentId === "string" ? payload.parentId.trim() : "";
    const author = normalizeString(session.user.name || "社区用户", 60);
    const email = normalizeString(session.user.email || "", 120);
    const content = normalizeString(payload.content, 2000);

    if (!postId || !content) return errorJson("缺少必填字段", 400);
    if (email && !EMAIL_RE.test(email)) return errorJson("邮箱格式不合法", 400);

    const post = await prisma.post.findFirst({ where: { id: postId, published: true } });
    if (!post) {
      return errorJson("文章不存在", 404);
    }

    let parentComment: { id: string; userId: string | null } | null = null;
    if (parentId) {
      const parent = await prisma.comment.findUnique({ where: { id: parentId }, select: { id: true, userId: true, postId: true } });
      if (!parent) return errorJson("父评论不存在", 404);
      if (parent.postId !== postId) return errorJson("父评论不属于当前文章", 400);
      parentComment = { id: parent.id, userId: parent.userId };
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        author,
        email: email || "",
        postId,
        parentId: parentId || null,
        approved: false,
        userId: session.user.id,
      },
    });

    if (parentComment?.userId) {
      await createNotification({
        userId: parentComment.userId,
        actorId: session.user.id,
        type: "COMMENT_REPLY",
        title: "你的评论收到了回复",
        body: content.slice(0, 80),
        targetId: comment.id,
        targetUrl: post.type === "COMMUNITY" ? `/community/${post.slug}` : `/blog/${post.slug}`,
      });
    }
    await awardBadgesForUser(session.user.id);
    if (parentComment?.userId) await awardBadgesForUser(parentComment.userId);

    return safeJson(comment, { status: 201 });
  } catch {
    return errorJson("服务器错误", 500);
  }
}
