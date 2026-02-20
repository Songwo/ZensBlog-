import { errorJson, safeJson } from "@/lib/api";
import { consumeIntegrationBindCode } from "@/lib/user-settings";
import { sendTelegramBindAck } from "@/lib/integration-reply";

function extractBindCode(text: string) {
  const match = text.match(/bind[_:\s-]?([A-Z0-9]{6,20})/i);
  return match?.[1]?.toUpperCase() || "";
}

export async function POST(request: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  const incoming = request.headers.get("x-telegram-bot-api-secret-token") || "";
  if (secret && incoming !== secret) return errorJson("invalid secret", 401);

  try {
    const payload = (await request.json()) as {
      message?: { text?: string; from?: { username?: string }; chat?: { id?: number | string } };
    };
    const text = payload?.message?.text || "";
    const code = extractBindCode(text);
    if (!code) return safeJson({ ok: true, ignored: true });

    const username = payload?.message?.from?.username || "";
    const chatId = payload?.message?.chat?.id || "";
    const result = await consumeIntegrationBindCode("telegram", code, {
      telegramUsername: username,
    });
    if (!result.ok) {
      if (chatId) await sendTelegramBindAck(chatId, `绑定失败：${result.error || "绑定码无效"}`);
      return safeJson({ ok: false, error: result.error });
    }
    if (chatId) {
      await sendTelegramBindAck(chatId, `绑定成功，已关联到 ZensBlog 账号${username ? `（@${username}）` : ""}。`);
    }
    return safeJson({ ok: true });
  } catch {
    return errorJson("invalid payload", 400);
  }
}
