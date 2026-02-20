import { randomUUID } from "crypto";
import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

type RateLimitOptions = {
  limit: number;
  windowMs: number;
  namespace: string;
};

type RateBucket = {
  count: number;
  resetAt: number;
};

const rateBuckets = new Map<string, RateBucket>();
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/$/, "");
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

export const ALLOWED_CONFIG_KEYS = [
  "siteName",
  "siteDescription",
  "siteUrl",
  "authorName",
  "effectsLevel",
  "rewardQrImage",
  "rewardText",
  "adTitle",
  "adDescription",
  "adImage",
  "adLink",
] as const;
export type AllowedConfigKey = (typeof ALLOWED_CONFIG_KEYS)[number];

export function getClientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown-ip";
}

export function sha256Hex(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function getUserAgent(request: Request) {
  return request.headers.get("user-agent") || "";
}

export function getDeviceIdFromRequest(request: Request) {
  const explicit = request.headers.get("x-device-id");
  if (explicit && explicit.trim()) return explicit.trim().slice(0, 128);
  const ip = getClientIp(request);
  const ua = getUserAgent(request);
  return `${ip}|${ua}`.slice(0, 512);
}

export function getDeviceHash(request: Request) {
  return sha256Hex(getDeviceIdFromRequest(request));
}

export function getIpHash(request: Request) {
  return sha256Hex(getClientIp(request));
}

function checkRateLimitLocal(request: Request, options: RateLimitOptions) {
  const now = Date.now();
  const key = `${options.namespace}:${getClientIp(request)}`;
  const existing = rateBuckets.get(key);

  if (!existing || now >= existing.resetAt) {
    rateBuckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return { allowed: true, remaining: options.limit - 1, resetAt: now + options.windowMs };
  }

  if (existing.count >= options.limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  rateBuckets.set(key, existing);
  return { allowed: true, remaining: options.limit - existing.count, resetAt: existing.resetAt };
}

export async function checkRateLimit(request: Request, options: RateLimitOptions) {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    return checkRateLimitLocal(request, options);
  }

  const now = Date.now();
  const key = `rl:${options.namespace}:${getClientIp(request)}`;

  try {
    const response = await fetch(`${UPSTASH_URL}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", key],
        ["PEXPIRE", key, options.windowMs, "NX"],
      ]),
      cache: "no-store",
    });

    if (!response.ok) return checkRateLimitLocal(request, options);

    const data = (await response.json()) as Array<{ result?: unknown }>;
    const count = Number(data?.[0]?.result ?? 0);
    if (!Number.isFinite(count) || count <= 0) return checkRateLimitLocal(request, options);

    return {
      allowed: count <= options.limit,
      remaining: Math.max(0, options.limit - count),
      resetAt: now + options.windowMs,
    };
  } catch {
    return checkRateLimitLocal(request, options);
  }
}

export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host = request.headers.get("host");
  if (!host) return false;

  try {
    const originUrl = new URL(origin);
    return originUrl.host === host;
  } catch {
    return false;
  }
}

export async function requireAdminSession() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const normalizedRole = (role || "").toUpperCase();
  if (!session?.user || (normalizedRole !== "ADMIN" && role !== "admin")) return null;
  return session;
}

export function safeJson(data: unknown, init?: ResponseInit) {
  const response = NextResponse.json(data, init);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Frame-Options", "DENY");
  return response;
}

export function errorJson(message: string, status = 400) {
  return safeJson({ error: message }, { status });
}

export function isValidSlug(value: string): boolean {
  return SLUG_RE.test(value);
}

export function normalizeString(value: unknown, maxLen: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLen);
}

export function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function createUploadFilename(extension: string) {
  return `${Date.now()}-${randomUUID().slice(0, 8)}.${extension}`;
}
