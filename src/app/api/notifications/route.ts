import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorJson, safeJson } from "@/lib/api";

type NotificationRow = {
  id: string;
  type: "LIKE" | "COMMENT_REPLY" | "MESSAGE";
  title: string;
  body: string;
  targetUrl: string | null;
  readAt: Date | null;
  createdAt: Date;
};

type CacheEntry = {
  at: number;
  unreadCount: number;
  notifications: NotificationRow[];
};

const cacheStore = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5_000;

function parseSince(raw: string | null) {
  if (!raw) return null;
  const asNum = Number(raw);
  if (Number.isFinite(asNum) && asNum > 0) {
    return new Date(asNum);
  }
  const asDate = new Date(raw);
  if (Number.isNaN(asDate.getTime())) return null;
  return asDate;
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return errorJson("未授权", 401);
  const userId = session.user.id;
  const requestUrl = new URL(request.url);
  const since = parseSince(requestUrl.searchParams.get("since"));

  if (!since) {
    const cached = cacheStore.get(userId);
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
      const response = safeJson({
        unreadCount: cached.unreadCount,
        notifications: cached.notifications,
        incremental: false,
        cached: true,
        serverTime: Date.now(),
      });
      response.headers.set("Cache-Control", "private, max-age=5");
      return response;
    }
  }

  const [unreadCount, notifications] = await Promise.all([
    prisma.notification.count({ where: { userId, readAt: null } }),
    prisma.notification.findMany({
      where: {
        userId,
        ...(since ? { createdAt: { gt: since } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: since ? 20 : 10,
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

  if (!since) {
    cacheStore.set(userId, {
      at: Date.now(),
      unreadCount,
      notifications,
    });
  } else {
    const existing = cacheStore.get(userId);
    if (existing) {
      const merged = [...notifications, ...existing.notifications].slice(0, 30);
      cacheStore.set(userId, {
        at: Date.now(),
        unreadCount,
        notifications: merged,
      });
    }
  }

  const response = safeJson({
    unreadCount,
    notifications,
    incremental: Boolean(since),
    cached: false,
    serverTime: Date.now(),
  });
  response.headers.set("Cache-Control", "private, max-age=5");
  return response;
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
      cacheStore.delete(session.user.id);
      return safeJson({ success: true });
    }
    if (!payload.id) return errorJson("缺少通知 ID", 400);

    await prisma.notification.updateMany({
      where: { id: payload.id, userId: session.user.id, readAt: null },
      data: { readAt: new Date() },
    });
    cacheStore.delete(session.user.id);
    return safeJson({ success: true });
  } catch {
    return errorJson("操作失败", 500);
  }
}
