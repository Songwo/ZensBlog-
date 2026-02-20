import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  checkRateLimit,
  errorJson,
  getDeviceHash,
  getIpHash,
  isSameOrigin,
  normalizeString,
  requireAdminSession,
  safeJson,
} from "@/lib/api";

const REPORT_REASONS = ["SPAM", "POLITICS", "ABUSE", "PORN", "COPYRIGHT", "OTHER"] as const;
const REPORT_STATUS = ["OPEN", "RESOLVED", "IGNORED"] as const;

function validReason(value: string): value is (typeof REPORT_REASONS)[number] {
  return (REPORT_REASONS as readonly string[]).includes(value);
}

function validStatus(value: string): value is (typeof REPORT_STATUS)[number] {
  return (REPORT_STATUS as readonly string[]).includes(value);
}

async function resolveIdentity(request: Request) {
  const session = await auth();
  const userId = session?.user?.id || null;
  const deviceHash = userId ? null : getDeviceHash(request);
  return { userId, deviceHash, ipHash: getIpHash(request) };
}

export async function GET(request: Request) {
  const admin = await requireAdminSession();
  if (!admin) return errorJson("未授权", 401);

  const { searchParams } = new URL(request.url);
  const status = normalizeString(searchParams.get("status") || "OPEN", 20).toUpperCase();
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") || 20)));
  const skip = (page - 1) * pageSize;
  const q = normalizeString(searchParams.get("q") || "", 100);

  const where: Record<string, unknown> = {};
  if (validStatus(status)) where.status = status;
  if (q) where.OR = [{ targetId: { contains: q } }, { detail: { contains: q } }];

  const [items, total] = await Promise.all([
    prisma.report.findMany({
      where,
      include: {
        user: { select: { id: true, username: true, name: true } },
        post: { select: { id: true, title: true, slug: true } },
        comment: { select: { id: true, content: true, post: { select: { slug: true } } } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.report.count({ where }),
  ]);

  return safeJson({
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return errorJson("非法来源请求", 403);
  const rate = await checkRateLimit(request, { namespace: "api-report-create", limit: 20, windowMs: 60_000 });
  if (!rate.allowed) return errorJson("请求过于频繁，请稍后再试", 429);

  const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!payload) return errorJson("请求体格式错误", 400);
  const targetTypeRaw = normalizeString(payload.targetType, 20).toUpperCase();
  const targetType = targetTypeRaw === "POST" ? "POST" : targetTypeRaw === "COMMENT" ? "COMMENT" : "";
  const targetId = normalizeString(payload.targetId, 64);
  const reasonRaw = normalizeString(payload.reason, 20).toUpperCase();
  const detail = normalizeString(payload.detail, 500);
  if (!targetType || !targetId) return errorJson("目标参数缺失", 400);
  if (!validReason(reasonRaw)) return errorJson("举报理由不合法", 400);

  const identity = await resolveIdentity(request);
  const existed = await prisma.report.findFirst({
    where: {
      targetType,
      targetId,
      OR: [
        ...(identity.userId ? [{ userId: identity.userId }] : []),
        ...(identity.deviceHash ? [{ deviceHash: identity.deviceHash }] : []),
      ],
    },
    select: { id: true },
  });
  if (existed) return errorJson("你已经举报过该内容", 409);

  if (targetType === "POST") {
    const post = await prisma.post.findUnique({ where: { id: targetId }, select: { id: true } });
    if (!post) return errorJson("文章不存在", 404);
  } else {
    const comment = await prisma.comment.findUnique({ where: { id: targetId }, select: { id: true } });
    if (!comment) return errorJson("评论不存在", 404);
  }

  const created = await prisma.report.create({
    data: {
      targetType,
      targetId,
      postId: targetType === "POST" ? targetId : null,
      commentId: targetType === "COMMENT" ? targetId : null,
      reason: reasonRaw,
      detail,
      status: "OPEN",
      ipHash: identity.ipHash,
      deviceHash: identity.deviceHash,
      userId: identity.userId,
    },
  });

  const openCount = await prisma.report.count({ where: { targetType, targetId, status: "OPEN" } });
  if (openCount >= 5) {
    if (targetType === "POST") {
      await prisma.post.update({ where: { id: targetId }, data: { hiddenByReports: true } }).catch(() => undefined);
    } else {
      await prisma.comment.update({ where: { id: targetId }, data: { hiddenByReports: true } }).catch(() => undefined);
    }
  }

  return safeJson({ report: created }, { status: 201 });
}

export async function PATCH(request: Request) {
  const admin = await requireAdminSession();
  if (!admin) return errorJson("未授权", 401);
  if (!isSameOrigin(request)) return errorJson("非法来源请求", 403);

  const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!payload) return errorJson("请求体格式错误", 400);
  const id = normalizeString(payload.id, 64);
  const status = normalizeString(payload.status, 20).toUpperCase();
  if (!id || !validStatus(status)) return errorJson("参数不合法", 400);

  const updated = await prisma.report.update({
    where: { id },
    data: { status },
  });

  if (updated.targetType === "POST" && updated.postId) {
    const openCount = await prisma.report.count({ where: { targetType: "POST", targetId: updated.postId, status: "OPEN" } });
    if (openCount < 5) {
      await prisma.post.update({ where: { id: updated.postId }, data: { hiddenByReports: false } }).catch(() => undefined);
    }
  }
  if (updated.targetType === "COMMENT" && updated.commentId) {
    const openCount = await prisma.report.count({ where: { targetType: "COMMENT", targetId: updated.commentId, status: "OPEN" } });
    if (openCount < 5) {
      await prisma.comment.update({ where: { id: updated.commentId }, data: { hiddenByReports: false } }).catch(() => undefined);
    }
  }

  return safeJson({ report: updated });
}

export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) return errorJson("非法来源请求", 403);
  const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!payload) return errorJson("请求体格式错误", 400);
  const targetTypeRaw = normalizeString(payload.targetType, 20).toUpperCase();
  const targetType = targetTypeRaw === "POST" ? "POST" : targetTypeRaw === "COMMENT" ? "COMMENT" : "";
  const targetId = normalizeString(payload.targetId, 64);
  if (!targetType || !targetId) return errorJson("参数不合法", 400);

  const identity = await resolveIdentity(request);
  const result = await prisma.report.deleteMany({
    where: {
      targetType,
      targetId,
      OR: [
        ...(identity.userId ? [{ userId: identity.userId }] : []),
        ...(identity.deviceHash ? [{ deviceHash: identity.deviceHash }] : []),
      ],
    },
  });

  return safeJson({ success: true, count: result.count });
}

