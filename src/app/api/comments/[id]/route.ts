import { prisma } from "@/lib/db";
import { checkRateLimit, errorJson, isSameOrigin, requireAdminSession, safeJson } from "@/lib/api";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminSession();
  if (!session) return errorJson("未授权", 401);
  if (!isSameOrigin(request)) return errorJson("非法来源请求", 403);
  const rate = await checkRateLimit(request, { namespace: "api-comment-update", limit: 80, windowMs: 60_000 });
  if (!rate.allowed) return errorJson("请求过于频繁，请稍后再试", 429);

  const { id } = await params;
  let approved: unknown;
  let status: unknown;
  try {
    const payload = await request.json() as { approved?: unknown; status?: unknown; hiddenByReports?: unknown };
    approved = payload.approved;
    status = payload.status;
  } catch {
    return errorJson("请求体格式错误", 400);
  }
  if (approved !== undefined && typeof approved !== "boolean") return errorJson("approved 字段不合法", 400);
  if (status !== undefined && !["PENDING", "APPROVED", "REJECTED", "SPAM"].includes(String(status))) {
    return errorJson("status 字段不合法", 400);
  }

  const nextStatus =
    typeof status === "string"
      ? status
      : approved === true
        ? "APPROVED"
        : approved === false
          ? "REJECTED"
          : undefined;
  if (!nextStatus) return errorJson("缺少可更新字段", 400);

  let comment;
  try {
    comment = await prisma.comment.update({
      where: { id },
      data: {
        status: nextStatus as "PENDING" | "APPROVED" | "REJECTED" | "SPAM",
        approved: nextStatus === "APPROVED",
      },
    });
  } catch {
    return errorJson("评论不存在", 404);
  }

  return safeJson(comment);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminSession();
  if (!session) return errorJson("未授权", 401);
  if (!isSameOrigin(request)) return errorJson("非法来源请求", 403);
  const rate = await checkRateLimit(request, { namespace: "api-comment-delete", limit: 60, windowMs: 60_000 });
  if (!rate.allowed) return errorJson("请求过于频繁，请稍后再试", 429);

  const { id } = await params;
  try {
    await prisma.comment.delete({ where: { id } });
  } catch {
    return errorJson("评论不存在", 404);
  }
  return safeJson({ success: true });
}
