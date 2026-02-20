import { auth } from "@/lib/auth";
import { checkRateLimit, errorJson, isSameOrigin, safeJson } from "@/lib/api";
import { pushNotificationExternal } from "@/lib/push";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return errorJson("未授权", 401);
  if (!isSameOrigin(request)) return errorJson("非法来源请求", 403);
  const rate = await checkRateLimit(request, { namespace: "api-me-notify-test", limit: 10, windowMs: 60_000 });
  if (!rate.allowed) return errorJson("请求过于频繁，请稍后再试", 429);

  await pushNotificationExternal(session.user.id, {
    title: "测试通知",
    body: "这是一条测试消息，用于校验你的通知渠道配置。",
    targetUrl: "/settings/profile",
  });

  return safeJson({ success: true });
}
