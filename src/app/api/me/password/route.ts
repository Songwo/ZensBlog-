import { compare, hash } from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkRateLimit, errorJson, isSameOrigin, normalizeString, safeJson } from "@/lib/api";
import { createSystemNotification } from "@/lib/notifications";

function scorePassword(pwd: string) {
  let score = 0;
  if (pwd.length >= 8) score += 1;
  if (/[A-Z]/.test(pwd)) score += 1;
  if (/[a-z]/.test(pwd)) score += 1;
  if (/\d/.test(pwd)) score += 1;
  if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
  return score;
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return errorJson("未授权", 401);
  if (!isSameOrigin(request)) return errorJson("非法来源请求", 403);
  const rate = await checkRateLimit(request, { namespace: "api-me-password", limit: 12, windowMs: 60_000 });
  if (!rate.allowed) return errorJson("请求过于频繁，请稍后再试", 429);

  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const oldPassword = normalizeString(payload.oldPassword, 200);
    const newPassword = normalizeString(payload.newPassword, 200);
    const confirmPassword = normalizeString(payload.confirmPassword, 200);

    if (!oldPassword || !newPassword || !confirmPassword) return errorJson("请完整填写密码字段", 400);
    if (newPassword !== confirmPassword) return errorJson("两次输入的新密码不一致", 400);
    if (newPassword.length < 8) return errorJson("新密码至少 8 位", 400);
    if (scorePassword(newPassword) < 3) return errorJson("新密码强度过弱，请混合字母数字符号", 400);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, passwordHash: true },
    });
    if (!user || !user.passwordHash) return errorJson("当前账号不支持密码修改，请使用第三方登录", 400);

    const valid = await compare(oldPassword, user.passwordHash);
    if (!valid) return errorJson("旧密码错误", 400);

    const newHash = await hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });
    await createSystemNotification({
      userId: user.id,
      title: "密码已修改",
      body: "你的账号密码刚刚完成更新。",
      targetUrl: "/settings/profile?tab=account",
    });

    return safeJson({ success: true });
  } catch {
    return errorJson("修改密码失败", 500);
  }
}
