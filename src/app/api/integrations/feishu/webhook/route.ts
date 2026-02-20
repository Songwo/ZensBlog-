import { errorJson, safeJson } from "@/lib/api";
import { consumeIntegrationBindCode } from "@/lib/user-settings";
import { sendFeishuBindAck } from "@/lib/integration-reply";

function extractBindCode(text: string) {
  const match = text.match(/bind[_:\s-]?([A-Z0-9]{6,20})/i);
  return match?.[1]?.toUpperCase() || "";
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Record<string, unknown>;

    // Feishu URL verification handshake
    if (typeof payload.challenge === "string") {
      return safeJson({ challenge: payload.challenge });
    }

    const event = (payload.event as Record<string, unknown> | undefined) || {};
    const sender = (event.sender as Record<string, unknown> | undefined) || {};
    const senderId = (sender.sender_id as Record<string, unknown> | undefined) || {};
    const openId = typeof senderId.open_id === "string" ? senderId.open_id : "";
    const senderName = typeof sender.name === "string" ? sender.name : "";
    const message = (event.message as Record<string, unknown> | undefined) || {};
    const chatId = typeof message.chat_id === "string" ? message.chat_id : "";
    const contentRaw = typeof message.content === "string" ? message.content : "";

    const code = extractBindCode(contentRaw);
    if (!code) return safeJson({ ok: true, ignored: true });

    const result = await consumeIntegrationBindCode("feishu", code, {
      feishuName: senderName || openId || "feishu-user",
    });
    if (!result.ok) {
      await sendFeishuBindAck({
        chatId,
        openId,
        text: `绑定失败：${result.error || "绑定码无效"}`,
      });
      return safeJson({ ok: false, error: result.error });
    }
    await sendFeishuBindAck({
      chatId,
      openId,
      text: `绑定成功，已关联到 ZensBlog 账号${senderName ? `（${senderName}）` : ""}。`,
    });
    return safeJson({ ok: true });
  } catch {
    return errorJson("invalid payload", 400);
  }
}
