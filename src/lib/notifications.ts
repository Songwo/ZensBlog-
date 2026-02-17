import { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/db";

type CreateNotificationInput = {
  userId: string;
  actorId?: string | null;
  type: NotificationType;
  title: string;
  body?: string;
  targetId?: string | null;
  targetUrl?: string | null;
};

export async function createNotification(input: CreateNotificationInput) {
  if (!input.userId) return;
  if (input.actorId && input.actorId === input.userId) return;

  await prisma.notification.create({
    data: {
      userId: input.userId,
      actorId: input.actorId || null,
      type: input.type,
      title: input.title,
      body: input.body || "",
      targetId: input.targetId || null,
      targetUrl: input.targetUrl || null,
    },
  });
}

export async function getUnreadNotificationCount(userId: string) {
  return prisma.notification.count({
    where: { userId, readAt: null },
  });
}
