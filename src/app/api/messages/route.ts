import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { errorJson, normalizeString, safeJson } from "@/lib/api";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return errorJson("未授权", 401);

  const [unreadCount, inbox] = await Promise.all([
    prisma.message.count({ where: { receiverId: session.user.id, readAt: null } }),
    prisma.message.findMany({
      where: { receiverId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        content: true,
        readAt: true,
        createdAt: true,
        sender: {
          select: { id: true, username: true, name: true, image: true },
        },
      },
    }),
  ]);

  return safeJson({ unreadCount, inbox });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return errorJson("未授权", 401);

  try {
    const payload = (await request.json()) as {
      receiverId?: string;
      receiverUsername?: string;
      content?: string;
      markReadId?: string;
    };

    if (payload.markReadId) {
      await prisma.message.updateMany({
        where: { id: payload.markReadId, receiverId: session.user.id, readAt: null },
        data: { readAt: new Date() },
      });
      return safeJson({ success: true });
    }

    const content = normalizeString(payload.content, 2000);
    if (!content) return errorJson("消息内容不能为空", 400);

    let receiverId = payload.receiverId || "";
    if (!receiverId && payload.receiverUsername) {
      const user = await prisma.user.findUnique({
        where: { username: payload.receiverUsername },
        select: { id: true },
      });
      receiverId = user?.id || "";
    }
    if (!receiverId) return errorJson("接收方不存在", 404);
    if (receiverId === session.user.id) return errorJson("不能给自己发私信", 400);

    const message = await prisma.message.create({
      data: {
        senderId: session.user.id,
        receiverId,
        content,
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
      },
    });

    await createNotification({
      userId: receiverId,
      actorId: session.user.id,
      type: "MESSAGE",
      title: "你收到一条新私信",
      body: content.slice(0, 80),
      targetId: message.id,
      targetUrl: "/settings/profile?tab=messages",
    });

    return safeJson({ success: true, message });
  } catch {
    return errorJson("发送失败", 500);
  }
}
