import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { checkRateLimit, errorJson, getDeviceHash, safeJson } from "@/lib/api";

async function resolveIdentity(request: Request) {
  const session = await auth();
  if (session?.user?.id) {
    return { userId: session.user.id, deviceHash: null as string | null };
  }
  return { userId: null as string | null, deviceHash: getDeviceHash(request) };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const rate = await checkRateLimit(request, { namespace: "api-comment-like-create", limit: 80, windowMs: 60_000 });
  if (!rate.allowed) return errorJson("请求过于频繁，请稍后再试", 429);

  const { id } = await params;
  const identity = await resolveIdentity(request);
  if (!identity.userId && !identity.deviceHash) return errorJson("身份识别失败", 400);

  const comment = await prisma.comment.findUnique({ where: { id }, select: { id: true } });
  if (!comment) return errorJson("评论不存在", 404);

  await prisma.commentLike.upsert({
    where: identity.userId
      ? { commentId_userId: { commentId: id, userId: identity.userId } }
      : { commentId_deviceHash: { commentId: id, deviceHash: identity.deviceHash! } },
    update: {},
    create: {
      commentId: id,
      userId: identity.userId,
      deviceHash: identity.deviceHash,
    },
  });

  const [count, viewerLike] = await Promise.all([
    prisma.commentLike.count({ where: { commentId: id } }),
    prisma.commentLike.findFirst({
      where: identity.userId
        ? { commentId: id, userId: identity.userId }
        : { commentId: id, deviceHash: identity.deviceHash! },
      select: { id: true },
    }),
  ]);

  return safeJson({ liked: Boolean(viewerLike), count });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const rate = await checkRateLimit(request, { namespace: "api-comment-like-delete", limit: 80, windowMs: 60_000 });
  if (!rate.allowed) return errorJson("请求过于频繁，请稍后再试", 429);

  const { id } = await params;
  const identity = await resolveIdentity(request);
  if (!identity.userId && !identity.deviceHash) return errorJson("身份识别失败", 400);

  await prisma.commentLike.deleteMany({
    where: identity.userId
      ? { commentId: id, userId: identity.userId }
      : { commentId: id, deviceHash: identity.deviceHash! },
  });

  const count = await prisma.commentLike.count({ where: { commentId: id } });
  return safeJson({ liked: false, count });
}

