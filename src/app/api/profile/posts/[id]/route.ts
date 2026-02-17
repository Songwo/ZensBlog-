import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { checkRateLimit, errorJson, isSameOrigin, normalizeString, safeJson } from "@/lib/api";

async function ensureOwner(postId: string, userId: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      id: true,
      authorId: true,
      title: true,
      slug: true,
      excerpt: true,
      content: true,
      published: true,
      type: true,
      createdAt: true,
      publishedAt: true,
      views: true,
      _count: { select: { likes: true, comments: true } },
    },
  });
  if (!post) return { error: errorJson("文章不存在", 404), post: null as null };
  if (post.authorId !== userId) return { error: errorJson("无权限操作该文章", 403), post: null as null };
  return { error: null as Response | null, post };
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return errorJson("未授权", 401);
  const { id } = await params;
  const { error, post } = await ensureOwner(id, session.user.id);
  if (error) return error;
  return safeJson({ post });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return errorJson("未授权", 401);
  if (!isSameOrigin(request)) return errorJson("非法来源请求", 403);

  const rate = await checkRateLimit(request, { namespace: "api-profile-post-update", limit: 30, windowMs: 60_000 });
  if (!rate.allowed) return errorJson("请求过于频繁，请稍后再试", 429);

  const { id } = await params;
  const ownership = await ensureOwner(id, session.user.id);
  if (ownership.error) return ownership.error;

  try {
    const data: unknown = await request.json();
    if (!data || typeof data !== "object" || Array.isArray(data)) return errorJson("请求体格式错误", 400);
    const payload = data as Record<string, unknown>;
    const title = normalizeString(payload.title, 180);
    const excerpt = normalizeString(payload.excerpt, 240);
    const content = normalizeString(payload.content, 30_000);
    const published = Boolean(payload.published);
    if (!title || !content) return errorJson("标题与内容不能为空", 400);

    const updated = await prisma.post.update({
      where: { id },
      data: {
        title,
        excerpt: excerpt || content.slice(0, 140),
        content,
        published,
        publishedAt: published ? ownership.post?.publishedAt || new Date() : null,
      },
      select: { id: true, slug: true },
    });

    return safeJson({ success: true, post: updated });
  } catch {
    return errorJson("更新失败", 500);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return errorJson("未授权", 401);
  if (!isSameOrigin(request)) return errorJson("非法来源请求", 403);

  const rate = await checkRateLimit(request, { namespace: "api-profile-post-delete", limit: 30, windowMs: 60_000 });
  if (!rate.allowed) return errorJson("请求过于频繁，请稍后再试", 429);

  const { id } = await params;
  const { error } = await ensureOwner(id, session.user.id);
  if (error) return error;

  try {
    await prisma.post.delete({ where: { id } });
    return safeJson({ success: true });
  } catch {
    return errorJson("删除失败", 500);
  }
}
