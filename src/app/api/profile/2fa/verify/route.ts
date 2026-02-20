import { auth } from "@/lib/auth";
import { checkRateLimit, errorJson, isSameOrigin, normalizeString, safeJson } from "@/lib/api";
import { enableTwoFactor } from "@/lib/user-settings";
import { createSystemNotification } from "@/lib/notifications";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return errorJson("未授权", 401);
  if (!isSameOrigin(request)) return errorJson("非法来源请求", 403);
  const rate = await checkRateLimit(request, { namespace: "api-profile-2fa-verify", limit: 20, windowMs: 60_000 });
  if (!rate.allowed) return errorJson("请求过于频繁，请稍后再试", 429);

  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const code = normalizeString(payload.code, 12);
    if (!code) return errorJson("验证码不能为空", 400);

    const result = await enableTwoFactor(session.user.id, code);
    if (!result.ok) return errorJson(result.error || "验证失败", 400);
    await createSystemNotification({
      userId: session.user.id,
      title: "双重验证已开启",
      body: "Google Authenticator 已绑定成功。",
      targetUrl: "/settings/profile?tab=auth",
    });
    return safeJson({ success: true, recoveryCodes: result.recoveryCodes || [] });
  } catch {
    return errorJson("服务器错误", 500);
  }
}
