import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkRateLimit, errorJson, isSameOrigin, normalizeString, safeJson } from "@/lib/api";
import { createIntegrationBindCode, unbindIntegration } from "@/lib/user-settings";
import { createSystemNotification } from "@/lib/notifications";

function requireBotUsername() {
  return process.env.TELEGRAM_BOT_USERNAME?.trim() || "";
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return errorJson("未授权", 401);
  if (!isSameOrigin(request)) return errorJson("非法来源请求", 403);
  const rate = await checkRateLimit(request, { namespace: "api-me-integrations", limit: 20, windowMs: 60_000 });
  if (!rate.allowed) return errorJson("请求过于频繁，请稍后再试", 429);

  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const provider = normalizeString(payload.provider, 30).toLowerCase();
    if (!["github", "google", "telegram", "feishu"].includes(provider)) return errorJson("不支持解绑该集成", 400);

    if (provider === "github" || provider === "google") {
      await prisma.account.deleteMany({
        where: { userId: session.user.id, provider },
      });
    } else {
      await unbindIntegration(session.user.id, provider as "telegram" | "feishu");
    }
    await createSystemNotification({
      userId: session.user.id,
      title: "集成已解绑",
      body: `${provider} 已从你的账号解绑。`,
      targetUrl: "/settings/profile?tab=integrations",
    });
    return safeJson({ success: true });
  } catch {
    return errorJson("解绑失败", 500);
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return errorJson("未授权", 401);
  if (!isSameOrigin(request)) return errorJson("非法来源请求", 403);
  const rate = await checkRateLimit(request, { namespace: "api-me-integrations-start", limit: 20, windowMs: 60_000 });
  if (!rate.allowed) return errorJson("请求过于频繁，请稍后再试", 429);

  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const provider = normalizeString(payload.provider, 30).toLowerCase();
    if (!["telegram", "feishu"].includes(provider)) return errorJson("当前仅支持 Telegram/飞书机器人绑定码", 400);

    const bind = await createIntegrationBindCode(session.user.id, provider as "telegram" | "feishu");
    await createSystemNotification({
      userId: session.user.id,
      title: "绑定码已生成",
      body: `${provider} 绑定码已生成，请在 10 分钟内完成绑定。`,
      targetUrl: "/settings/profile?tab=integrations",
    });
    if (provider === "telegram") {
      const botUsername = requireBotUsername();
      const deepLink = botUsername ? `https://t.me/${botUsername}?start=bind_${bind.code}` : "";
      return safeJson({ success: true, provider, code: bind.code, expiresAt: bind.expiresAt, deepLink });
    }
    return safeJson({ success: true, provider, code: bind.code, expiresAt: bind.expiresAt });
  } catch {
    return errorJson("生成绑定码失败", 500);
  }
}
