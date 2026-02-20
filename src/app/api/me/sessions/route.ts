import { auth } from "@/lib/auth";
import { checkRateLimit, errorJson, isSameOrigin, normalizeString, safeJson } from "@/lib/api";
import { clearOtherSessions, touchUserSessionActivity } from "@/lib/user-settings";
import { createSystemNotification } from "@/lib/notifications";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return errorJson("未授权", 401);
  const { sessions, currentSessionId } = await touchUserSessionActivity(session.user.id, request);
  return safeJson({ sessions, currentSessionId });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return errorJson("未授权", 401);
  if (!isSameOrigin(request)) return errorJson("非法来源请求", 403);
  const rate = await checkRateLimit(request, { namespace: "api-me-sessions", limit: 20, windowMs: 60_000 });
  if (!rate.allowed) return errorJson("请求过于频繁，请稍后再试", 429);

  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const currentSessionId = normalizeString(payload.currentSessionId, 64);
    if (!currentSessionId) return errorJson("缺少当前会话标识", 400);
    const sessions = await clearOtherSessions(session.user.id, currentSessionId);
    await createSystemNotification({
      userId: session.user.id,
      title: "已退出其他设备",
      body: "除当前设备外的登录会话已失效。",
      targetUrl: "/settings/profile?tab=security",
    });
    return safeJson({ success: true, sessions });
  } catch {
    return errorJson("退出其他设备失败", 500);
  }
}
