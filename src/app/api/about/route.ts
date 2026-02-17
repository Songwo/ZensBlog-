import { prisma } from "@/lib/db";
import { cache, cacheKey } from "@/lib/cache";
import {
  checkRateLimit,
  errorJson,
  isSameOrigin,
  normalizeString,
  requireAdminSession,
  safeJson,
} from "@/lib/api";

const ABOUT_ID = "about";

export async function GET() {
  const key = cacheKey("about:content");
  const cached = cache.get(key);
  if (cached) return safeJson(cached);

  const about = await prisma.aboutPage.findUnique({
    where: { id: ABOUT_ID },
  });

  if (!about) {
    const defaultContent = { id: ABOUT_ID, content: "", updatedAt: new Date() };
    cache.set(key, defaultContent, 600);
    return safeJson(defaultContent);
  }

  cache.set(key, about, 600);
  return safeJson(about);
}

export async function PUT(request: Request) {
  const session = await requireAdminSession();
  if (!session) return errorJson("未授权", 401);
  if (!isSameOrigin(request)) return errorJson("非法来源请求", 403);

  const rate = await checkRateLimit(request, { namespace: "api-about-update", limit: 30, windowMs: 60_000 });
  if (!rate.allowed) return errorJson("请求过于频繁，请稍后再试", 429);

  try {
    const data: unknown = await request.json();
    if (!data || typeof data !== "object" || Array.isArray(data)) return errorJson("请求体格式错误", 400);

    const payload = data as Record<string, unknown>;
    const content = normalizeString(payload.content, 50_000);

    if (!content) return errorJson("内容不能为空", 400);

    const about = await prisma.aboutPage.upsert({
      where: { id: ABOUT_ID },
      create: {
        id: ABOUT_ID,
        content,
      },
      update: {
        content,
      },
    });

    cache.delete(cacheKey("about:content"));
    return safeJson(about);
  } catch {
    return errorJson("服务器错误", 500);
  }
}
