import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  checkRateLimit,
  errorJson,
  isSameOrigin,
  normalizeString,
  safeJson,
} from "@/lib/api";
import { slugify } from "@/lib/utils";

export async function GET() {
  const posts = await prisma.post.findMany({
    where: { published: true, type: "COMMUNITY" },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
          title: true,
          activeBadge: { select: { id: true, name: true, icon: true, iconUrl: true, color: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return safeJson({ posts });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return errorJson("请先登录后再发帖", 401);
  if (!isSameOrigin(request)) return errorJson("非法来源请求", 403);

  const rate = await checkRateLimit(request, { namespace: "api-community-post", limit: 20, windowMs: 60_000 });
  if (!rate.allowed) return errorJson("请求过于频繁，请稍后再试", 429);

  try {
    const data: unknown = await request.json();
    if (!data || typeof data !== "object" || Array.isArray(data)) return errorJson("请求体格式错误", 400);
    const payload = data as Record<string, unknown>;
    const title = normalizeString(payload.title, 180);
    const content = normalizeString(payload.content, 30_000);
    const excerpt = normalizeString(payload.excerpt, 240);
    if (!title || !content) return errorJson("标题与内容不能为空", 400);

    let slug = slugify(title);
    if (!slug) slug = `community-${Date.now()}`;
    const baseSlug = slug;
    let counter = 1;
    while (await prisma.post.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter += 1;
    }

    const post = await prisma.post.create({
      data: {
        title,
        slug,
        content,
        excerpt: excerpt || content.slice(0, 140),
        type: "COMMUNITY",
        authorId: session.user.id,
        published: true,
        publishedAt: new Date(),
      },
    });

    return safeJson(post, { status: 201 });
  } catch {
    return errorJson("发布失败", 500);
  }
}
