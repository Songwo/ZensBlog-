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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const rate = await checkRateLimit(request, { namespace: "api-post-read", limit: 180, windowMs: 60_000 });
  if (!rate.allowed) return errorJson("请求过于频繁，请稍后再试", 429);

  const session = await requireAdminSession();

  const post = session
    ? await prisma.post.findUnique({
        where: { id },
        include: { category: true, tags: { include: { tag: true } }, comments: true },
      })
    : await prisma.post.findFirst({
        where: { id, published: true, type: "OFFICIAL" },
        include: {
          category: true,
          tags: { include: { tag: true } },
          comments: { where: { approved: true }, orderBy: { createdAt: "desc" } },
        },
      });

  if (!post) return errorJson("文章不存在", 404);
  return safeJson(post);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminSession();
  if (!session) return errorJson("未授权", 401);
  if (!isSameOrigin(request)) return errorJson("非法来源请求", 403);
  const rate = await checkRateLimit(request, { namespace: "api-post-update", limit: 60, windowMs: 60_000 });
  if (!rate.allowed) return errorJson("请求过于频繁，请稍后再试", 429);

  const { id } = await params;

  try {
    const data: unknown = await request.json();
    if (!data || typeof data !== "object" || Array.isArray(data)) return errorJson("请求体格式错误", 400);
    const payload = data as Record<string, unknown>;
    const title = payload.title === undefined ? undefined : normalizeString(payload.title, 180);
    const slug = payload.slug === undefined ? undefined : normalizeString(payload.slug, 120).toLowerCase();
    const content = payload.content === undefined ? undefined : normalizeString(payload.content, 120_000);
    const excerpt = payload.excerpt === undefined ? undefined : normalizeString(payload.excerpt, 320);
    const coverImage = payload.coverImage === undefined ? undefined : normalizeString(payload.coverImage, 500);
    const published = payload.published === undefined ? undefined : Boolean(payload.published);
    const pinned = payload.pinned === undefined ? undefined : Boolean(payload.pinned);
    const categoryId =
      payload.categoryId === undefined
        ? undefined
        : typeof payload.categoryId === "string" && payload.categoryId.trim()
          ? payload.categoryId.trim()
          : null;
    const tagIds = payload.tagIds === undefined ? undefined : parseTagIds(payload.tagIds);

    const existing = await prisma.post.findUnique({ where: { id } });
    if (!existing) return errorJson("文章不存在", 404);

    if (slug && slug !== existing.slug) {
      if (!isValidSlug(slug)) return errorJson("slug 格式不合法", 400);
      const slugExists = await prisma.post.findUnique({ where: { slug } });
      if (slugExists) return errorJson("slug 已存在", 409);
    }
    if (coverImage && !coverImage.startsWith("/uploads/") && !isValidHttpUrl(coverImage)) {
      return errorJson("封面图地址不合法", 400);
    }

    const post = await prisma.$transaction(async (tx) => {
      const updated = await tx.post.update({
        where: { id },
        data: {
          ...(title !== undefined && { title }),
          ...(slug !== undefined && { slug }),
          ...(content !== undefined && { content }),
          ...(excerpt !== undefined && { excerpt }),
          ...(coverImage !== undefined && { coverImage }),
          ...(published !== undefined && {
            published,
            publishedAt: published && !existing.publishedAt ? new Date() : existing.publishedAt,
          }),
          ...(pinned !== undefined && { pinned }),
          ...(categoryId !== undefined && { categoryId: categoryId || null }),
        },
      });

      if (tagIds !== undefined) {
        await tx.postTag.deleteMany({ where: { postId: id } });
        if (tagIds.length) {
          await tx.postTag.createMany({
            data: tagIds.map((tagId) => ({ postId: id, tagId })),
          });
        }
      }

      return updated;
    });

    cache.deletePattern("posts:list:.*");
    return safeJson(post);
  } catch {
    return errorJson("服务器错误", 500);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminSession();
  if (!session) return errorJson("未授权", 401);
  if (!isSameOrigin(request)) return errorJson("非法来源请求", 403);
  const rate = await checkRateLimit(request, { namespace: "api-post-delete", limit: 30, windowMs: 60_000 });
  if (!rate.allowed) return errorJson("请求过于频繁，请稍后再试", 429);

  const { id } = await params;
  try {
    await prisma.post.delete({ where: { id } });
    cache.deletePattern("posts:list:.*");
  } catch {
    return errorJson("文章不存在", 404);
  }
  return safeJson({ success: true });
}
