import { prisma } from "@/lib/db";
import { cache, cacheKey } from "@/lib/cache";
import {
  checkRateLimit,
  errorJson,
  isSameOrigin,
  isValidHttpUrl,
  isValidSlug,
  normalizeString,
  requireAdminSession,
  safeJson,
} from "@/lib/api";

function parseTagIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => typeof item === "string" && item.trim().length > 0))];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(50, parseInt(searchParams.get("limit") || "20"));
  const published = searchParams.get("published");
  const session = await requireAdminSession();
  const isAdmin = Boolean(session);

  const key = cacheKey("posts:list", page, limit, published || "all", isAdmin);
  const cached = cache.get(key);
  if (cached) return safeJson(cached);

  const where: Record<string, unknown> = {};
  where.type = "OFFICIAL";
  if (!isAdmin) {
    where.published = true;
  } else if (published === "true") {
    where.published = true;
  } else if (published === "false") {
    where.published = false;
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: { category: true, tags: { include: { tag: true } }, _count: { select: { comments: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.post.count({ where }),
  ]);

  const result = { posts, total, page, totalPages: Math.ceil(total / limit) };
  cache.set(key, result, 60);
  return safeJson(result);
}

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session) return errorJson("未授权", 401);
  if (!isSameOrigin(request)) return errorJson("非法来源请求", 403);

  const rate = await checkRateLimit(request, { namespace: "api-post-create", limit: 30, windowMs: 60_000 });
  if (!rate.allowed) return errorJson("请求过于频繁，请稍后再试", 429);

  try {
    const data: unknown = await request.json();
    if (!data || typeof data !== "object" || Array.isArray(data)) return errorJson("请求体格式错误", 400);

    const payload = data as Record<string, unknown>;
    const title = normalizeString(payload.title, 180);
    const slug = normalizeString(payload.slug, 120).toLowerCase();
    const content = normalizeString(payload.content, 120_000);
    const excerpt = normalizeString(payload.excerpt, 320);
    const coverImage = normalizeString(payload.coverImage, 500);
    const published = Boolean(payload.published);
    const pinned = Boolean(payload.pinned);
    const categoryId = typeof payload.categoryId === "string" && payload.categoryId.trim() ? payload.categoryId.trim() : null;
    const tagIds = parseTagIds(payload.tagIds);

    if (!title || !slug || !content) return errorJson("缺少必填字段", 400);
    if (!isValidSlug(slug)) return errorJson("slug 格式不合法", 400);
    if (coverImage && !coverImage.startsWith("/uploads/") && !isValidHttpUrl(coverImage)) {
      return errorJson("封面图地址不合法", 400);
    }

    const existing = await prisma.post.findUnique({ where: { slug } });
    if (existing) return errorJson("slug 已存在", 409);

    const post = await prisma.$transaction(async (tx) => {
      const created = await tx.post.create({
        data: {
          title,
          slug,
          content,
          excerpt: excerpt || "",
          coverImage: coverImage || "",
          published,
          pinned,
          type: "OFFICIAL",
          categoryId,
          publishedAt: published ? new Date() : null,
        },
      });

      if (tagIds.length) {
        await tx.postTag.createMany({
          data: tagIds.map((tagId) => ({ postId: created.id, tagId })),
        });
      }

      return created;
    });

    cache.deletePattern("posts:list:.*");
    return safeJson(post, { status: 201 });
  } catch {
    return errorJson("服务器错误", 500);
  }
}
