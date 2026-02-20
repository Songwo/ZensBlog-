import { auth } from "@/lib/auth";
import { checkRateLimit, errorJson, isSameOrigin, safeJson } from "@/lib/api";
import { updateUserNotifyPreferences, updateUserNotifySettings } from "@/lib/user-settings";
import { createSystemNotification } from "@/lib/notifications";

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return errorJson("未授权", 401);
  if (!isSameOrigin(request)) return errorJson("非法来源请求", 403);
  const rate = await checkRateLimit(request, { namespace: "api-me-notifications", limit: 40, windowMs: 60_000 });
  if (!rate.allowed) return errorJson("请求过于频繁，请稍后再试", 429);

  try {
    const payload = (await request.json()) as Record<string, unknown>;
    await Promise.all([
      updateUserNotifySettings(session.user.id, {
        feishuWebhook: typeof payload.feishuWebhook === "string" ? payload.feishuWebhook : undefined,
        wecomWebhook: typeof payload.wecomWebhook === "string" ? payload.wecomWebhook : undefined,
        emailTo: typeof payload.emailTo === "string" ? payload.emailTo : undefined,
        emailEnabled: typeof payload.emailEnabled === "boolean" ? payload.emailEnabled : undefined,
      }),
      updateUserNotifyPreferences(session.user.id, {
        comment: typeof payload.comment === "boolean" ? payload.comment : undefined,
        like: typeof payload.like === "boolean" ? payload.like : undefined,
        reply: typeof payload.reply === "boolean" ? payload.reply : undefined,
        report: typeof payload.report === "boolean" ? payload.report : undefined,
        message: typeof payload.message === "boolean" ? payload.message : undefined,
        inApp: typeof payload.inApp === "boolean" ? payload.inApp : undefined,
      }),
    ]);
    await createSystemNotification({
      userId: session.user.id,
      title: "通知配置已更新",
      body: "你的通知偏好和推送渠道配置已保存。",
      targetUrl: "/settings/profile?tab=notifications",
    });
    return safeJson({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "保存失败";
    return errorJson(message, 400);
  }
}
