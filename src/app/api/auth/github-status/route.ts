import { safeJson } from "@/lib/api";

export async function GET() {
  const timeoutMs = 2500;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch("https://api.github.com/meta", {
      method: "GET",
      headers: { "User-Agent": "zensblog-auth-check" },
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
