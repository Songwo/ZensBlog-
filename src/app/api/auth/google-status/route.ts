import { safeJson } from "@/lib/api";

export async function GET() {
  const hasEnv = Boolean(process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim());
  if (!hasEnv) {
    return safeJson({ available: false, status: 0, checkedAt: new Date().toISOString() });
  }

  const timeoutMs = 2500;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch("https://accounts.google.com/.well-known/openid-configuration", {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timer);
    return safeJson({ available: response.ok, status: response.status, checkedAt: new Date().toISOString() });
  } catch {
    clearTimeout(timer);
    return safeJson({ available: false, status: 0, checkedAt: new Date().toISOString() });
  }
}
