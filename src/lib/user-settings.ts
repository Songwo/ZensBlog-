import { randomUUID, createHash } from "crypto";
import { prisma } from "@/lib/db";
import { normalizeString, getClientIp, getUserAgent, sha256Hex } from "@/lib/api";
import { buildOtpAuthUri, generateTotpSecret, verifyTotp } from "@/lib/totp";
import { NotificationType } from "@prisma/client";

export type UserNotifySettings = {
  feishuWebhook: string;
  wecomWebhook: string;
  emailEnabled: boolean;
  emailTo: string;
};

export type UserNotifyPreferences = {
  comment: boolean;
  like: boolean;
  reply: boolean;
  report: boolean;
  message: boolean;
  inApp: boolean;
};

export type UserPrivacySettings = {
  showEmail: boolean;
  showSocialLinks: boolean;
};

export type UserCardSettings = {
  backgroundStyle: "pink-glass" | "ocean" | "sunset" | "night-grid";
  headline: string;
  showBio: boolean;
  showStats: boolean;
  showSocial: boolean;
  showLevel: boolean;
  showBadge: boolean;
};

type UserTwoFactorSettings = {
  enabled: boolean;
  secret: string;
  pendingSecret: string;
  verifiedAt: string;
  recoveryCodes: string[];
};

type SessionMeta = {
  id: string;
  ipHash: string;
  ua: string;
  firstSeenAt: string;
  lastSeenAt: string;
};

export type IntegrationState = {
  github: boolean;
  google: boolean;
  telegram: boolean;
  feishu: boolean;
  telegramUsername?: string;
  feishuName?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

function keyNotify(userId: string) {
  return `user:notify:${userId}`;
}

function keyTwoFactor(userId: string) {
  return `user:2fa:${userId}`;
}

function keyPrefs(userId: string) {
  return `user:prefs:${userId}`;
}

function keyPrivacy(userId: string) {
  return `user:privacy:${userId}`;
}

function keyCard(userId: string) {
  return `user:card:${userId}`;
}

function keySessionMeta(userId: string) {
  return `user:session-meta:${userId}`;
}

function keyIntegration(userId: string) {
  return `user:integration:${userId}`;
}

function keyBind(provider: "telegram" | "feishu", code: string) {
  return `bind:${provider}:${code}`;
}

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function defaultNotifyPreferences(): UserNotifyPreferences {
  return {
    comment: true,
    like: true,
    reply: true,
    report: true,
    message: true,
    inApp: true,
  };
}

function defaultPrivacySettings(): UserPrivacySettings {
  return {
    showEmail: false,
    showSocialLinks: true,
  };
}

function defaultCardSettings(): UserCardSettings {
  return {
    backgroundStyle: "pink-glass",
    headline: "",
    showBio: true,
    showStats: true,
    showSocial: true,
    showLevel: true,
    showBadge: true,
  };
}

export async function getUserNotifySettings(userId: string): Promise<UserNotifySettings> {
  const row = await prisma.siteConfig.findUnique({ where: { key: keyNotify(userId) } });
  const parsed = parseJson<Partial<UserNotifySettings>>(row?.value, {});
  return {
    feishuWebhook: typeof parsed.feishuWebhook === "string" ? parsed.feishuWebhook : "",
    wecomWebhook: typeof parsed.wecomWebhook === "string" ? parsed.wecomWebhook : "",
    emailEnabled: Boolean(parsed.emailEnabled),
    emailTo: typeof parsed.emailTo === "string" ? parsed.emailTo : "",
  };
}

export async function updateUserNotifySettings(userId: string, input: Partial<UserNotifySettings>) {
  const current = await getUserNotifySettings(userId);
  const next: UserNotifySettings = {
    feishuWebhook: normalizeString(input.feishuWebhook ?? current.feishuWebhook, 500),
    wecomWebhook: normalizeString(input.wecomWebhook ?? current.wecomWebhook, 500),
    emailEnabled: typeof input.emailEnabled === "boolean" ? input.emailEnabled : current.emailEnabled,
    emailTo: normalizeString(input.emailTo ?? current.emailTo, 160).toLowerCase(),
  };

  if (next.emailTo && !EMAIL_RE.test(next.emailTo)) {
    throw new Error("通知邮箱格式不正确");
  }

  await prisma.siteConfig.upsert({
    where: { key: keyNotify(userId) },
    create: { key: keyNotify(userId), value: JSON.stringify(next) },
    update: { value: JSON.stringify(next) },
  });
  return next;
}

export async function getUserNotifyPreferences(userId: string): Promise<UserNotifyPreferences> {
  const row = await prisma.siteConfig.findUnique({ where: { key: keyPrefs(userId) } });
  const parsed = parseJson<Partial<UserNotifyPreferences>>(row?.value, {});
  return { ...defaultNotifyPreferences(), ...parsed };
}

export async function updateUserNotifyPreferences(userId: string, input: Partial<UserNotifyPreferences>) {
  const current = await getUserNotifyPreferences(userId);
  const next: UserNotifyPreferences = {
    comment: typeof input.comment === "boolean" ? input.comment : current.comment,
    like: typeof input.like === "boolean" ? input.like : current.like,
    reply: typeof input.reply === "boolean" ? input.reply : current.reply,
    report: typeof input.report === "boolean" ? input.report : current.report,
    message: typeof input.message === "boolean" ? input.message : current.message,
    inApp: typeof input.inApp === "boolean" ? input.inApp : current.inApp,
  };
  await prisma.siteConfig.upsert({
    where: { key: keyPrefs(userId) },
    create: { key: keyPrefs(userId), value: JSON.stringify(next) },
    update: { value: JSON.stringify(next) },
  });
  return next;
}

export async function getUserPrivacySettings(userId: string): Promise<UserPrivacySettings> {
  const row = await prisma.siteConfig.findUnique({ where: { key: keyPrivacy(userId) } });
  const parsed = parseJson<Partial<UserPrivacySettings>>(row?.value, {});
  return { ...defaultPrivacySettings(), ...parsed };
}

export async function updateUserPrivacySettings(userId: string, input: Partial<UserPrivacySettings>) {
  const current = await getUserPrivacySettings(userId);
  const next: UserPrivacySettings = {
    showEmail: typeof input.showEmail === "boolean" ? input.showEmail : current.showEmail,
    showSocialLinks: typeof input.showSocialLinks === "boolean" ? input.showSocialLinks : current.showSocialLinks,
  };
  await prisma.siteConfig.upsert({
    where: { key: keyPrivacy(userId) },
    create: { key: keyPrivacy(userId), value: JSON.stringify(next) },
    update: { value: JSON.stringify(next) },
  });
  return next;
}

export async function getUserCardSettings(userId: string): Promise<UserCardSettings> {
  const row = await prisma.siteConfig.findUnique({ where: { key: keyCard(userId) } });
  const parsed = parseJson<Partial<UserCardSettings>>(row?.value, {});
  const defaults = defaultCardSettings();
  const allowedStyle = parsed.backgroundStyle;
  return {
    backgroundStyle:
      allowedStyle === "pink-glass" || allowedStyle === "ocean" || allowedStyle === "sunset" || allowedStyle === "night-grid"
        ? allowedStyle
        : defaults.backgroundStyle,
    headline: typeof parsed.headline === "string" ? normalizeString(parsed.headline, 80) : defaults.headline,
    showBio: typeof parsed.showBio === "boolean" ? parsed.showBio : defaults.showBio,
    showStats: typeof parsed.showStats === "boolean" ? parsed.showStats : defaults.showStats,
    showSocial: typeof parsed.showSocial === "boolean" ? parsed.showSocial : defaults.showSocial,
    showLevel: typeof parsed.showLevel === "boolean" ? parsed.showLevel : defaults.showLevel,
    showBadge: typeof parsed.showBadge === "boolean" ? parsed.showBadge : defaults.showBadge,
  };
}

export async function updateUserCardSettings(userId: string, input: Partial<UserCardSettings>) {
  const current = await getUserCardSettings(userId);
  const next: UserCardSettings = {
    backgroundStyle:
      input.backgroundStyle === "pink-glass" ||
      input.backgroundStyle === "ocean" ||
      input.backgroundStyle === "sunset" ||
      input.backgroundStyle === "night-grid"
        ? input.backgroundStyle
        : current.backgroundStyle,
    headline: normalizeString(input.headline ?? current.headline, 80),
    showBio: typeof input.showBio === "boolean" ? input.showBio : current.showBio,
    showStats: typeof input.showStats === "boolean" ? input.showStats : current.showStats,
    showSocial: typeof input.showSocial === "boolean" ? input.showSocial : current.showSocial,
    showLevel: typeof input.showLevel === "boolean" ? input.showLevel : current.showLevel,
    showBadge: typeof input.showBadge === "boolean" ? input.showBadge : current.showBadge,
  };

  await prisma.siteConfig.upsert({
    where: { key: keyCard(userId) },
    create: { key: keyCard(userId), value: JSON.stringify(next) },
    update: { value: JSON.stringify(next) },
  });
  return next;
}

export async function getUserTwoFactorSettings(userId: string): Promise<UserTwoFactorSettings> {
  const row = await prisma.siteConfig.findUnique({ where: { key: keyTwoFactor(userId) } });
  const parsed = parseJson<Partial<UserTwoFactorSettings>>(row?.value, {});
  return {
    enabled: Boolean(parsed.enabled),
    secret: typeof parsed.secret === "string" ? parsed.secret : "",
    pendingSecret: typeof parsed.pendingSecret === "string" ? parsed.pendingSecret : "",
    verifiedAt: typeof parsed.verifiedAt === "string" ? parsed.verifiedAt : "",
    recoveryCodes: Array.isArray(parsed.recoveryCodes) ? parsed.recoveryCodes : [],
  };
}

function generateRecoveryCodes() {
  return Array.from({ length: 8 }).map(() => randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase());
}

export async function createTwoFactorSetup(userId: string, accountName: string, issuer = "ZensBlog") {
  const secret = generateTotpSecret();
  const current = await getUserTwoFactorSettings(userId);
  const next: UserTwoFactorSettings = {
    ...current,
    pendingSecret: secret,
  };

  await prisma.siteConfig.upsert({
    where: { key: keyTwoFactor(userId) },
    create: { key: keyTwoFactor(userId), value: JSON.stringify(next) },
    update: { value: JSON.stringify(next) },
  });

  return {
    secret,
    otpauth: buildOtpAuthUri({ issuer, accountName, secret }),
  };
}

export async function enableTwoFactor(userId: string, token: string) {
  const current = await getUserTwoFactorSettings(userId);
  if (!current.pendingSecret) return { ok: false, error: "请先创建绑定二维码" };
  if (!verifyTotp(token, current.pendingSecret)) return { ok: false, error: "验证码无效" };

  const recoveryCodes = generateRecoveryCodes();
  const next: UserTwoFactorSettings = {
    enabled: true,
    secret: current.pendingSecret,
    pendingSecret: "",
    verifiedAt: new Date().toISOString(),
    recoveryCodes: recoveryCodes.map((code) => sha256Hex(code)),
  };

  await prisma.siteConfig.upsert({
    where: { key: keyTwoFactor(userId) },
    create: { key: keyTwoFactor(userId), value: JSON.stringify(next) },
    update: { value: JSON.stringify(next) },
  });
  return { ok: true, recoveryCodes };
}

export async function disableTwoFactor(userId: string, token?: string) {
  const current = await getUserTwoFactorSettings(userId);
  if (!current.enabled || !current.secret) {
    await prisma.siteConfig.deleteMany({ where: { key: keyTwoFactor(userId) } });
    return { ok: true };
  }

  if (!token || !verifyTotp(token, current.secret)) {
    return { ok: false, error: "验证码错误，无法关闭双重验证" };
  }

  await prisma.siteConfig.deleteMany({ where: { key: keyTwoFactor(userId) } });
  return { ok: true };
}

export async function verifyUserTwoFactorLogin(userId: string, token: string) {
  const current = await getUserTwoFactorSettings(userId);
  if (!current.enabled || !current.secret) return true;
  if (!token) return false;

  if (verifyTotp(token, current.secret)) return true;

  const tokenHash = sha256Hex(token.trim().toUpperCase());
  if (!current.recoveryCodes.includes(tokenHash)) return false;

  const next = {
    ...current,
    recoveryCodes: current.recoveryCodes.filter((item) => item !== tokenHash),
  };

  await prisma.siteConfig.upsert({
    where: { key: keyTwoFactor(userId) },
    create: { key: keyTwoFactor(userId), value: JSON.stringify(next) },
    update: { value: JSON.stringify(next) },
  });
  return true;
}

export function shouldSendNotificationByType(preferences: UserNotifyPreferences, type: NotificationType) {
  if (type === "LIKE") return preferences.like;
  if (type === "COMMENT_REPLY") return preferences.reply || preferences.comment;
  if (type === "MESSAGE") return preferences.message;
  return true;
}

function getCurrentSessionTokenFromRequest(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader
      .split(";")
      .map((v) => v.trim())
      .filter(Boolean)
      .map((v) => {
        const idx = v.indexOf("=");
        if (idx < 0) return [v, ""];
        return [v.slice(0, idx), decodeURIComponent(v.slice(idx + 1))];
      })
  );
  return (
    cookies["authjs.session-token"] ||
    cookies["__Secure-authjs.session-token"] ||
    cookies["next-auth.session-token"] ||
    cookies["__Secure-next-auth.session-token"] ||
    ""
  );
}

export async function touchUserSessionActivity(userId: string, request: Request) {
  const currentToken = getCurrentSessionTokenFromRequest(request);
  const sessions = await prisma.session.findMany({
    where: { userId },
    select: { sessionToken: true, expires: true },
    orderBy: { expires: "desc" },
    take: 20,
  });

  const metaRow = await prisma.siteConfig.findUnique({ where: { key: keySessionMeta(userId) } });
  const metaMap = parseJson<Record<string, SessionMeta>>(metaRow?.value, {});

  const ipHash = createHash("sha256").update(getClientIp(request)).digest("hex");
  const ua = normalizeString(getUserAgent(request), 160) || "Unknown Device";
  const nowIso = new Date().toISOString();

  for (const s of sessions) {
    const id = sha256Hex(s.sessionToken).slice(0, 24);
    if (!metaMap[id]) {
      metaMap[id] = { id, ipHash, ua, firstSeenAt: nowIso, lastSeenAt: nowIso };
    }
    if (s.sessionToken === currentToken) {
      metaMap[id] = { ...metaMap[id], ipHash, ua, lastSeenAt: nowIso };
    }
  }

  await prisma.siteConfig.upsert({
    where: { key: keySessionMeta(userId) },
    create: { key: keySessionMeta(userId), value: JSON.stringify(metaMap) },
    update: { value: JSON.stringify(metaMap) },
  });

  return {
    currentSessionId: currentToken ? sha256Hex(currentToken).slice(0, 24) : "",
    sessions: sessions.map((s) => {
      const id = sha256Hex(s.sessionToken).slice(0, 24);
      const meta = metaMap[id];
      return {
        id,
        ipHash: meta?.ipHash || "",
        ua: meta?.ua || "Unknown Device",
        firstSeenAt: meta?.firstSeenAt || nowIso,
        lastSeenAt: meta?.lastSeenAt || nowIso,
        expiresAt: s.expires.toISOString(),
      };
    }),
  };
}

export async function clearOtherSessions(userId: string, currentSessionId: string) {
  const sessions = await prisma.session.findMany({ where: { userId }, select: { sessionToken: true } });
  const toDelete = sessions
    .filter((s) => sha256Hex(s.sessionToken).slice(0, 24) !== currentSessionId)
    .map((s) => s.sessionToken);

  if (toDelete.length) {
    await prisma.session.deleteMany({ where: { userId, sessionToken: { in: toDelete } } });
  }

  const metaRow = await prisma.siteConfig.findUnique({ where: { key: keySessionMeta(userId) } });
  const metaMap = parseJson<Record<string, SessionMeta>>(metaRow?.value, {});
  const keptMap = Object.fromEntries(Object.entries(metaMap).filter(([id]) => id === currentSessionId));
  await prisma.siteConfig.upsert({
    where: { key: keySessionMeta(userId) },
    create: { key: keySessionMeta(userId), value: JSON.stringify(keptMap) },
    update: { value: JSON.stringify(keptMap) },
  });

  return keptMap;
}

export async function getUserIntegrationState(userId: string, base?: Partial<IntegrationState>) {
  const row = await prisma.siteConfig.findUnique({ where: { key: keyIntegration(userId) } });
  const parsed = parseJson<Partial<IntegrationState>>(row?.value, {});
  return {
    github: Boolean(base?.github),
    google: Boolean(base?.google),
    telegram: Boolean(parsed.telegram),
    feishu: Boolean(parsed.feishu),
    telegramUsername: parsed.telegramUsername || "",
    feishuName: parsed.feishuName || "",
  } as IntegrationState;
}

export async function createIntegrationBindCode(userId: string, provider: "telegram" | "feishu") {
  const code = randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();
  const expiresAt = Date.now() + 10 * 60_000;
  await prisma.siteConfig.upsert({
    where: { key: keyBind(provider, code) },
    create: { key: keyBind(provider, code), value: JSON.stringify({ userId, provider, expiresAt }) },
    update: { value: JSON.stringify({ userId, provider, expiresAt }) },
  });
  return { code, expiresAt };
}

export async function consumeIntegrationBindCode(provider: "telegram" | "feishu", code: string, payload: Record<string, unknown>) {
  const key = keyBind(provider, code.toUpperCase());
  const row = await prisma.siteConfig.findUnique({ where: { key } });
  if (!row) return { ok: false as const, error: "绑定码不存在或已失效" };
  const parsed = parseJson<{ userId?: string; expiresAt?: number }>(row.value, {});
  if (!parsed.userId || !parsed.expiresAt || Date.now() > parsed.expiresAt) {
    await prisma.siteConfig.deleteMany({ where: { key } });
    return { ok: false as const, error: "绑定码已过期" };
  }

  const state = await getUserIntegrationState(parsed.userId);
  const next: IntegrationState = {
    ...state,
    telegram: provider === "telegram" ? true : state.telegram,
    feishu: provider === "feishu" ? true : state.feishu,
    telegramUsername: provider === "telegram" ? String(payload.telegramUsername || "") : state.telegramUsername,
    feishuName: provider === "feishu" ? String(payload.feishuName || "") : state.feishuName,
    github: state.github,
    google: state.google,
  };

  await prisma.siteConfig.upsert({
    where: { key: keyIntegration(parsed.userId) },
    create: { key: keyIntegration(parsed.userId), value: JSON.stringify(next) },
    update: { value: JSON.stringify(next) },
  });
  await prisma.siteConfig.deleteMany({ where: { key } });

  return { ok: true as const, userId: parsed.userId };
}

export async function unbindIntegration(userId: string, provider: "telegram" | "feishu") {
  const state = await getUserIntegrationState(userId);
  const next: IntegrationState = {
    ...state,
    telegram: provider === "telegram" ? false : state.telegram,
    feishu: provider === "feishu" ? false : state.feishu,
    telegramUsername: provider === "telegram" ? "" : state.telegramUsername,
    feishuName: provider === "feishu" ? "" : state.feishuName,
    github: state.github,
    google: state.google,
  };
  await prisma.siteConfig.upsert({
    where: { key: keyIntegration(userId) },
    create: { key: keyIntegration(userId), value: JSON.stringify(next) },
    update: { value: JSON.stringify(next) },
  });
}
