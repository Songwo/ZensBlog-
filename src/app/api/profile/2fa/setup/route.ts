import { auth } from "@/lib/auth";
import { errorJson, isSameOrigin, safeJson } from "@/lib/api";
import { createTwoFactorSetup } from "@/lib/user-settings";
import { createSystemNotification } from "@/lib/notifications";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return errorJson("未授权", 401);
  if (!isSameOrigin(request)) return errorJson("非法来源请求", 403);

  const accountName = session.user.email || session.user.username || session.user.name || "user";
  const setup = await createTwoFactorSetup(session.user.id, accountName);
  await createSystemNotification({
    userId: session.user.id,
    title: "2FA 绑定二维码已生成",
    body: "请在 10 分钟内完成 Google Authenticator 验证。",
    targetUrl: "/settings/profile?tab=auth",
  });

  return safeJson({
    secret: setup.secret,
    otpauth: setup.otpauth,
    qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(setup.otpauth)}`,
  });
}
