function withTimeout(ms: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, done: () => clearTimeout(timer) };
}

export async function sendTelegramBindAck(chatId: number | string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token || !chatId) return false;
  const req = withTimeout(2600);
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
      }),
      signal: req.signal,
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    req.done();
  }
}

async function getFeishuTenantToken() {
  const appId = process.env.FEISHU_APP_ID?.trim();
  const appSecret = process.env.FEISHU_APP_SECRET?.trim();
  if (!appId || !appSecret) return "";

  const req = withTimeout(2600);
  try {
    const res = await fetch("https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
      signal: req.signal,
      cache: "no-store",
    });
    if (!res.ok) return "";
    const payload = (await res.json()) as { tenant_access_token?: string };
    return payload.tenant_access_token || "";
  } catch {
    return "";
  } finally {
    req.done();
  }
}

export async function sendFeishuBindAck(opts: { chatId?: string; openId?: string; text: string }) {
  const token = await getFeishuTenantToken();
  if (!token) return false;

  const receiveIdType = opts.chatId ? "chat_id" : "open_id";
  const receiveId = opts.chatId || opts.openId || "";
  if (!receiveId) return false;

  const req = withTimeout(2600);
  try {
    const res = await fetch(`https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=${receiveIdType}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        receive_id: receiveId,
        msg_type: "text",
        content: JSON.stringify({ text: opts.text }),
      }),
      signal: req.signal,
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    req.done();
  }
}
