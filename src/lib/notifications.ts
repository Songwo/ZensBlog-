import { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { pushNotificationExternal } from "@/lib/push";
import { getUserNotifyPreferences, shouldSendNotificationByType } from "@/lib/user-settings";

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
  const preferences = await getUserNotifyPreferences(input.userId);
  if (!shouldSendNotificationByType(preferences, input.type)) return;

  if (preferences.inApp) {
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

  await pushNotificationExternal(input.userId, {
    title: input.title,
    body: input.body || "",
    targetUrl: input.targetUrl || null,
  });
}

export async function getUnreadNotificationCount(userId: string) {
  return prisma.notification.count({
    where: { userId, readAt: null },
  });
}

export async function createSystemNotification(input: {
  userId: string;
  title: string;
  body?: string;
  targetUrl?: string | null;
}) {
  if (!input.userId) return;
  await prisma.notification.create({
    data: {
      userId: input.userId,
      actorId: null,
      type: "MESSAGE",
      title: input.title,
      body: input.body || "",
      targetId: null,
      targetUrl: input.targetUrl || null,
    },
  });
}
