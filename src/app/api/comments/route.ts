import { prisma } from "@/lib/db";
import {
  checkRateLimit,
  errorJson,
  getDeviceHash,
  getIpHash,
  normalizeString,
  safeJson,
} from "@/lib/api";
import { auth } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { awardBadgesForUser } from "@/lib/badges";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SENSITIVE_WORDS = ["博彩", "赌博", "色情", "约炮", "发票", "办证", "涉政"];
const BLOCKED_DOMAINS = ["t.me", "bit.ly", "tinyurl.com"];

function getLinkCount(input: string) {
  return (input.match(/https?:\/\/[^\s]+/g) || []).length;
}

function hasBlockedDomain(input: string) {
  return BLOCKED_DOMAINS.some((domain) => new RegExp(`https?:\\/\\/[^\\s]*${domain.replace(".", "\\.")}`, "i").test(input));
}

function hasSensitiveWord(input: string) {
  const lower = input.toLowerCase();
  return SENSITIVE_WORDS.some((word) => lower.includes(word.toLowerCase()));
}

export async function GET(request: Request) {
  const rate = await checkRateLimit(request, { namespace: "api-comments-list", limit: 120, windowMs: 60_000 });
  if (!rate.allowed) return errorJson("请求过于频繁，请稍后再试", 429);

  const { searchParams } = new URL(request.url);
  const postId = normalizeString(searchParams.get("postId") || "", 64);
  if (!postId) return errorJson("postId 缺失", 400);

  const session = await auth();
  const deviceHash = getDeviceHash(request);

  const comments = await prisma.comment.findMany({
    where: { postId, parentId: null, status: "APPROVED", hiddenByReports: false },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          name: true,
          image: true,
          title: true,
          activeBadge: { select: { id: true, name: true, icon: true, iconUrl: true, color: true } },
        },
      },
      likes: {
        select: { userId: true, deviceHash: true },
      },
      replies: {
        where: { status: "APPROVED", hiddenByReports: false },
        orderBy: { createdAt: "asc" },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              image: true,
              title: true,
              activeBadge: { select: { id: true, name: true, icon: true, iconUrl: true, color: true } },
            },
          },
          likes: { select: { userId: true, deviceHash: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const withLikeState = comments.map((comment) => ({
    ...comment,
    likeCount: comment.likes.length,
    viewerLiked: comment.likes.some((like) =>
      session?.user?.id ? like.userId === session.user.id : like.deviceHash === deviceHash
    ),
    likes: undefined,
    replies: comment.replies.map((reply) => ({
      ...reply,
      likeCount: reply.likes.length,
      viewerLiked: reply.likes.some((like) =>
        session?.user?.id ? like.userId === session.user.id : like.deviceHash === deviceHash
      ),
      likes: undefined,
    })),
  }));

  return safeJson({ comments: withLikeState });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return errorJson("请先登录后再评论", 401);

  const rate = await checkRateLimit(request, { namespace: "api-comments-create", limit: 8, windowMs: 10 * 60_000 });
  if (!rate.allowed) return errorJson("评论过于频繁，请稍后再试", 429);

  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const postId = normalizeString(payload.postId, 64);
    const parentId = typeof payload.parentId === "string" ? payload.parentId.trim() : "";
    const author = normalizeString(session.user.name || "社区用户", 60);
    const email = normalizeString(session.user.email || "", 120);
    const content = normalizeString(payload.content, 2000);
    const deviceHash = getDeviceHash(request);
    const ipHash = getIpHash(request);

    if (!postId || !content) return errorJson("缺少必填字段", 400);
    if (email && !EMAIL_RE.test(email)) return errorJson("邮箱格式不合法", 400);

    const post = await prisma.post.findFirst({
      where: { id: postId, published: true, status: "PUBLISHED", hiddenByReports: false },
    });
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

    const oneMinuteAgo = new Date(Date.now() - 60_000);
    const sameIpRecentCount = await prisma.comment.count({
      where: {
        createdAt: { gte: oneMinuteAgo },
        ipHash,
      },
    });
    if (sameIpRecentCount >= 8) {
      return errorJson("提交过于频繁，请稍后再试", 429);
    }

    const duplicate = await prisma.comment.findFirst({
      where: {
        postId,
        content,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      select: { id: true },
    });

    const linkCount = getLinkCount(content);
    const hitSensitive = hasSensitiveWord(content);
    const hitBlockedDomain = hasBlockedDomain(content);

    let status: "PENDING" | "APPROVED" | "REJECTED" | "SPAM" = "PENDING";
    if (hitBlockedDomain || hitSensitive) status = "SPAM";
    else if (duplicate) status = "SPAM";
    else if (linkCount >= 4) status = "SPAM";
    else if (linkCount >= 2) status = "PENDING";

    const comment = await prisma.comment.create({
      data: {
        content,
        author,
        email: email || "",
        postId,
        parentId: parentId || null,
        approved: false,
        status,
        hiddenByReports: false,
        ipHash,
        deviceHash,
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

    return safeJson({ ...comment, status }, { status: 201 });
  } catch {
    return errorJson("服务器错误", 500);
  }
}
