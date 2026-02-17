import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorJson, safeJson } from "@/lib/api";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return errorJson("未授权", 401);

  const [unreadCount, notifications] = await Promise.all([
    prisma.notification.count({ where: { userId: session.user.id, readAt: null } }),
    prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        targetUrl: true,
        readAt: true,
        createdAt: true,
      },
    }),
  ]);

  return safeJson({ unreadCount, notifications });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return errorJson("未授权", 401);

  try {
    const payload = (await request.json()) as { id?: string; markAll?: boolean };
    if (payload.markAll) {
      await prisma.notification.updateMany({
        where: { userId: session.user.id, readAt: null },
        data: { readAt: new Date() },
      });
      return safeJson({ success: true });
    }
    if (!payload.id) return errorJson("缺少通知 ID", 400);

    await prisma.notification.updateMany({
      where: { id: payload.id, userId: session.user.id, readAt: null },
      data: { readAt: new Date() },
    });
    return safeJson({ success: true });
  } catch {
    return errorJson("操作失败", 500);
  }
}
