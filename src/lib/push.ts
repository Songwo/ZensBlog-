import { prisma } from "@/lib/db";
import { getUserNotifySettings } from "@/lib/user-settings";

type PushPayload = {
  title: string;
  body?: string;
  targetUrl?: string | null;
};

const NOTIFY_KEYS = [
  "notify:feishuWebhook",
  "notify:wecomWebhook",
  "notify:emailEnabled",
  "notify:emailTo",
] as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

function isHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

function timeoutSignal(ms: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

async function getGlobalNotifySettings() {
  const rows = await prisma.siteConfig.findMany({
    where: { key: { in: [...NOTIFY_KEYS] } },
  });
  const map = Object.fromEntries(rows.map((row) => [row.key, row.value]));

  return {
    feishuWebhook: map["notify:feishuWebhook"] || "",
    wecomWebhook: map["notify:wecomWebhook"] || "",
    emailEnabled: (map["notify:emailEnabled"] || "").toLowerCase() === "true",
    emailTo: map["notify:emailTo"] || "",
  };
}

async function postWebhook(url: string, payload: unknown) {
  if (!isHttpUrl(url)) return;
  const req = timeoutSignal(2600);
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: req.signal,
    });
  } catch {
    return;
  } finally {
    req.clear();
  }
}

async function sendEmailViaResend(to: string, payload: PushPayload) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey || !EMAIL_RE.test(to)) return;

  const from = process.env.NOTIFY_EMAIL_FROM?.trim() || "ZensBlog <no-reply@zensblog.dev>";
  const req = timeoutSignal(3000);
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `[ZensBlog] ${payload.title}`,
        text: `${payload.body || ""}${payload.targetUrl ? `\n\n查看详情: ${payload.targetUrl}` : ""}`,
      }),
      cache: "no-store",
      signal: req.signal,
    });
  } catch {
    return;
  } finally {
    req.clear();
  }
}

export async function pushNotificationExternal(userId: string, payload: PushPayload) {
  const [userSettings, globalSettings] = await Promise.all([
    getUserNotifySettings(userId),
    getGlobalNotifySettings(),
  ]);
  const settings = {
    feishuWebhook: userSettings.feishuWebhook || globalSettings.feishuWebhook,
    wecomWebhook: userSettings.wecomWebhook || globalSettings.wecomWebhook,
    emailEnabled: userSettings.emailEnabled || globalSettings.emailEnabled,
    emailTo: userSettings.emailTo || globalSettings.emailTo,
  };
  const tasks: Array<Promise<void>> = [];

  if (settings.feishuWebhook) {
    tasks.push(
      postWebhook(settings.feishuWebhook, {
        msg_type: "text",
        content: {
          text: `${payload.title}\n${payload.body || ""}${payload.targetUrl ? `\n${payload.targetUrl}` : ""}`,
        },
      })
    );
  }

  if (settings.wecomWebhook) {
    tasks.push(
      postWebhook(settings.wecomWebhook, {
        msgtype: "text",
        text: {
          content: `${payload.title}\n${payload.body || ""}${payload.targetUrl ? `\n${payload.targetUrl}` : ""}`,
        },
      })
    );
  }

  if (settings.emailEnabled && settings.emailTo) {
    tasks.push(sendEmailViaResend(settings.emailTo, payload));
  }

  if (tasks.length) await Promise.all(tasks);
}
