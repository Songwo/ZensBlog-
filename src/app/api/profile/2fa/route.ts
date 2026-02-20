import { auth } from "@/lib/auth";
import { checkRateLimit, errorJson, isSameOrigin, normalizeString, safeJson } from "@/lib/api";
import { disableTwoFactor, getUserTwoFactorSettings } from "@/lib/user-settings";
import { createSystemNotification } from "@/lib/notifications";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return errorJson("未授权", 401);
  const settings = await getUserTwoFactorSettings(session.user.id);
  return safeJson({ enabled: settings.enabled });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return errorJson("未授权", 401);
  if (!isSameOrigin(request)) return errorJson("非法来源请求", 403);
  const rate = await checkRateLimit(request, { namespace: "api-profile-2fa-disable", limit: 20, windowMs: 60_000 });
  if (!rate.allowed) return errorJson("请求过于频繁，请稍后再试", 429);

  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const code = normalizeString(payload.code, 12);
    const result = await disableTwoFactor(session.user.id, code);
    if (!result.ok) return errorJson(result.error || "关闭失败", 400);
    await createSystemNotification({
      userId: session.user.id,
      title: "双重验证已关闭",
      body: "账号已恢复为密码登录模式。",
      targetUrl: "/settings/profile?tab=auth",
    });
    return safeJson({ success: true });
  } catch {
    return errorJson("服务器错误", 500);
  }
}
