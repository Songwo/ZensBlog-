import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { checkRateLimit, errorJson, isSameOrigin, isValidHttpUrl, normalizeString, safeJson } from "@/lib/api";
import { slugify } from "@/lib/utils";

function parseTagIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => typeof item === "string" && item.trim().length > 0))];
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return errorJson("未授权", 401);
  if (!isSameOrigin(request)) return errorJson("非法来源请求", 403);

  const rate = await checkRateLimit(request, { namespace: "api-profile-post-create", limit: 20, windowMs: 60_000 });
  if (!rate.allowed) return errorJson("请求过于频繁，请稍后再试", 429);

  const role = (session.user as { role?: string }).role || "USER";
  const isAdmin = role.toUpperCase() === "ADMIN" || role === "admin";

  try {
    const data: unknown = await request.json();
    if (!data || typeof data !== "object" || Array.isArray(data)) return errorJson("请求体格式错误", 400);
    const payload = data as Record<string, unknown>;
    const title = normalizeString(payload.title, 180);
    const excerpt = normalizeString(payload.excerpt, 320);
    const content = normalizeString(payload.content, 120_000);
    const coverImage = normalizeString(payload.coverImage, 500);
    const categoryId = typeof payload.categoryId === "string" && payload.categoryId.trim() ? payload.categoryId.trim() : null;
    const tagIds = parseTagIds(payload.tagIds);
    const requestedPublished = payload.published === undefined ? false : Boolean(payload.published);
    const published = isAdmin ? requestedPublished : false;
    const status = isAdmin
      ? (published ? "PUBLISHED" : "DRAFT")
      : "PENDING";
    if (!title || !content) return errorJson("标题与内容不能为空", 400);
    if (coverImage && !coverImage.startsWith("/uploads/") && !isValidHttpUrl(coverImage)) {
      return errorJson("封面图地址不合法", 400);
    }

    let slug = slugify(title);
    if (!slug) slug = `post-${Date.now()}`;
    const baseSlug = slug;
    let counter = 1;
    while (await prisma.post.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter += 1;
    }

    const post = await prisma.$transaction(async (tx) => {
      const created = await tx.post.create({
        data: {
          title,
          slug,
          excerpt: excerpt || content.slice(0, 180),
          content,
          coverImage: coverImage || "",
          categoryId,
          type: "OFFICIAL",
          authorId: session.user.id,
          published,
          status,
          publishedAt: published ? new Date() : null,
        },
        select: { id: true, slug: true },
      });

      if (tagIds.length) {
        await tx.postTag.createMany({
          data: tagIds.map((tagId) => ({ postId: created.id, tagId })),
        });
      }

      return created;
    });

    return safeJson({ success: true, post }, { status: 201 });
  } catch {
    return errorJson("创建文章失败", 500);
  }
}
