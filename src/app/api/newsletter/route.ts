import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import {
  checkRateLimit,
  errorJson,
  isSameOrigin,
  requireAdminSession,
  safeJson,
} from "@/lib/api";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
const NOTIFY_SETTINGS_KEYS = [
  "notify:feishuWebhook",
  "notify:wecomWebhook",
  "notify:emailEnabled",
  "notify:emailTo",
] as const;

function isValidHttpUrl(value: string) {
  if (!value) return true;
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export async function GET() {
  const session = await requireAdminSession();
  if (!session) return errorJson("未授权", 401);

  const [rows, settingRows] = await Promise.all([
    prisma.siteConfig.findMany({
      where: { key: { startsWith: "newsletter:" } },
      orderBy: { key: "asc" },
    }),
    prisma.siteConfig.findMany({
      where: { key: { in: [...NOTIFY_SETTINGS_KEYS] } },
    }),
  ]);

  const subscribers = rows
    .map((row) => {
      try {
        return JSON.parse(row.value) as { email: string; createdAt: string; source: string };
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  const settingsMap = Object.fromEntries(settingRows.map((row) => [row.key, row.value]));

  return safeJson({
    subscribers,
    notifySettings: {
      feishuWebhook: settingsMap["notify:feishuWebhook"] || "",
      wecomWebhook: settingsMap["notify:wecomWebhook"] || "",
      emailEnabled: (settingsMap["notify:emailEnabled"] || "").toLowerCase() === "true",
      emailTo: settingsMap["notify:emailTo"] || "",
    },
  });
}

export async function POST(request: Request) {
  const rate = await checkRateLimit(request, { namespace: "api-newsletter-subscribe", limit: 20, windowMs: 60_000 });
  if (!rate.allowed) return errorJson("订阅过于频繁，请稍后再试", 429);

  try {
    const data: unknown = await request.json();
    if (!data || typeof data !== "object" || Array.isArray(data)) return errorJson("请求体格式错误", 400);
    const payload = data as Record<string, unknown>;
    const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
    const source = typeof payload.source === "string" ? payload.source.trim().slice(0, 50) : "site";

    if (!EMAIL_RE.test(email)) return errorJson("邮箱格式不正确", 400);

    await prisma.siteConfig.upsert({
      where: { key: `newsletter:${email}` },
      create: {
        key: `newsletter:${email}`,
        value: JSON.stringify({ email, createdAt: new Date().toISOString(), source }),
      },
      update: {
        value: JSON.stringify({ email, createdAt: new Date().toISOString(), source }),
      },
    });

    revalidatePath("/admin/newsletter");
    return safeJson({ success: true });
  } catch {
    return errorJson("服务器错误", 500);
  }
}

export async function DELETE(request: Request) {
  const session = await requireAdminSession();
  if (!session) return errorJson("未授权", 401);
  if (!isSameOrigin(request)) return errorJson("非法来源请求", 403);

  const rate = await checkRateLimit(request, { namespace: "api-newsletter-delete", limit: 40, windowMs: 60_000 });
  if (!rate.allowed) return errorJson("请求过于频繁，请稍后再试", 429);

  try {
    const data: unknown = await request.json();
    if (!data || typeof data !== "object" || Array.isArray(data)) return errorJson("请求体格式错误", 400);
    const payload = data as Record<string, unknown>;
    const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
    if (!EMAIL_RE.test(email)) return errorJson("邮箱格式不正确", 400);

    await prisma.siteConfig.deleteMany({ where: { key: `newsletter:${email}` } });
    revalidatePath("/admin/newsletter");
    return safeJson({ success: true });
  } catch {
    return errorJson("服务器错误", 500);
  }
}

export async function PATCH(request: Request) {
  const session = await requireAdminSession();
  if (!session) return errorJson("未授权", 401);
  if (!isSameOrigin(request)) return errorJson("非法来源请求", 403);

  const rate = await checkRateLimit(request, { namespace: "api-newsletter-settings", limit: 20, windowMs: 60_000 });
  if (!rate.allowed) return errorJson("请求过于频繁，请稍后再试", 429);

  try {
    const data: unknown = await request.json();
    if (!data || typeof data !== "object" || Array.isArray(data)) return errorJson("请求体格式错误", 400);
    const payload = data as Record<string, unknown>;

    const feishuWebhook = typeof payload.feishuWebhook === "string" ? payload.feishuWebhook.trim() : "";
    const wecomWebhook = typeof payload.wecomWebhook === "string" ? payload.wecomWebhook.trim() : "";
    const emailTo = typeof payload.emailTo === "string" ? payload.emailTo.trim().toLowerCase() : "";
    const emailEnabled = Boolean(payload.emailEnabled);

    if (!isValidHttpUrl(feishuWebhook)) return errorJson("飞书 Webhook 地址不合法", 400);
    if (!isValidHttpUrl(wecomWebhook)) return errorJson("企业微信 Webhook 地址不合法", 400);
    if (emailTo && !EMAIL_RE.test(emailTo)) return errorJson("通知邮箱格式不正确", 400);

    await prisma.$transaction([
      prisma.siteConfig.upsert({
        where: { key: "notify:feishuWebhook" },
        create: { key: "notify:feishuWebhook", value: feishuWebhook },
        update: { value: feishuWebhook },
      }),
      prisma.siteConfig.upsert({
        where: { key: "notify:wecomWebhook" },
        create: { key: "notify:wecomWebhook", value: wecomWebhook },
        update: { value: wecomWebhook },
      }),
      prisma.siteConfig.upsert({
        where: { key: "notify:emailEnabled" },
        create: { key: "notify:emailEnabled", value: emailEnabled ? "true" : "false" },
        update: { value: emailEnabled ? "true" : "false" },
      }),
      prisma.siteConfig.upsert({
        where: { key: "notify:emailTo" },
        create: { key: "notify:emailTo", value: emailTo },
        update: { value: emailTo },
      }),
    ]);

    revalidatePath("/admin/newsletter");
    return safeJson({ success: true });
  } catch {
    return errorJson("服务器错误", 500);
  }
}
