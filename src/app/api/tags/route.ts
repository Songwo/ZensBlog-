import { prisma } from "@/lib/db";
import { cache, cacheKey } from "@/lib/cache";
import { checkRateLimit, errorJson, isSameOrigin, isValidSlug, normalizeString, requireAdminSession, safeJson } from "@/lib/api";

export async function GET() {
  const key = cacheKey("tags:list");
  const cached = cache.get(key);
  if (cached) return safeJson(cached);

  const tags = await prisma.tag.findMany({
    include: { _count: { select: { posts: true } } },
    orderBy: { name: "asc" },
  });

  cache.set(key, tags, 300);
  return safeJson(tags);
}

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session) return errorJson("未授权", 401);
  if (!isSameOrigin(request)) return errorJson("非法来源请求", 403);
  const rate = await checkRateLimit(request, { namespace: "api-tag-create", limit: 60, windowMs: 60_000 });
  if (!rate.allowed) return errorJson("请求过于频繁，请稍后再试", 429);

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return errorJson("请求体格式错误", 400);
  }
  const name = normalizeString(payload.name, 64);
  const slug = normalizeString(payload.slug, 64).toLowerCase();
  if (!name || !slug) return errorJson("缺少必填字段", 400);
  if (!isValidSlug(slug)) return errorJson("slug 格式不合法", 400);

  try {
    const tag = await prisma.tag.create({ data: { name, slug } });
    cache.delete(cacheKey("tags:list"));
    return safeJson(tag, { status: 201 });
  } catch {
    return errorJson("标签已存在", 409);
  }
}
