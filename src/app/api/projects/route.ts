import { prisma } from "@/lib/db";
import { cache, cacheKey } from "@/lib/cache";
import { revalidatePath } from "next/cache";
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

function parseTagsArray(value: unknown): string {
  if (!Array.isArray(value)) return "";
  const tags = value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  return [...new Set(tags)].slice(0, 10).join(",");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const published = searchParams.get("published");
  const featured = searchParams.get("featured");
  const session = await requireAdminSession();
  const isAdmin = Boolean(session);

  const key = cacheKey("projects:list", published || "all", featured || "all", isAdmin);
  const cached = cache.get(key);
  if (cached) return safeJson(cached);

  const where: Record<string, unknown> = {};
  if (!isAdmin) {
    where.published = true;
  } else if (published === "true") {
    where.published = true;
  } else if (published === "false") {
    where.published = false;
  }

  if (featured === "true") {
    where.featured = true;
  } else if (featured === "false") {
    where.featured = false;
  }

  const projects = await prisma.project.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  const result = { projects, total: projects.length };
  cache.set(key, result, 120);
  return safeJson(result);
}

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session) return errorJson("未授权", 401);
  if (!isSameOrigin(request)) return errorJson("非法来源请求", 403);

  const rate = await checkRateLimit(request, { namespace: "api-project-create", limit: 30, windowMs: 60_000 });
  if (!rate.allowed) return errorJson("请求过于频繁，请稍后再试", 429);

  try {
    const data: unknown = await request.json();
    if (!data || typeof data !== "object" || Array.isArray(data)) return errorJson("请求体格式错误", 400);

    const payload = data as Record<string, unknown>;
    const title = normalizeString(payload.title, 200);
    const slug = normalizeString(payload.slug, 150).toLowerCase();
    const description = normalizeString(payload.description, 5000);
    const content = normalizeString(payload.content, 50_000);
    const coverImage = normalizeString(payload.coverImage, 500);
    const demoUrl = normalizeString(payload.demoUrl, 500);
    const githubUrl = normalizeString(payload.githubUrl, 500);
    const tags = parseTagsArray(payload.tags);
    const published = Boolean(payload.published);
    const featured = Boolean(payload.featured);
    const sortOrder = typeof payload.sortOrder === "number" ? payload.sortOrder : 0;

    if (!title || !slug || !description) return errorJson("缺少必填字段", 400);
    if (!isValidSlug(slug)) return errorJson("slug 格式不合法", 400);
    if (coverImage && !coverImage.startsWith("/uploads/") && !isValidHttpUrl(coverImage)) {
      return errorJson("封面图地址不合法", 400);
    }
    if (demoUrl && !isValidHttpUrl(demoUrl)) return errorJson("演示地址不合法", 400);
    if (githubUrl && !isValidHttpUrl(githubUrl)) return errorJson("GitHub 地址不合法", 400);

    const existing = await prisma.project.findUnique({ where: { slug } });
    if (existing) return errorJson("slug 已存在", 409);

    const project = await prisma.project.create({
      data: {
        title,
        slug,
        description,
        content: content || "",
        coverImage: coverImage || "",
        demoUrl: demoUrl || "",
        githubUrl: githubUrl || "",
        tags,
        published,
        featured,
        sortOrder,
      },
    });

    cache.deletePattern("projects:list:.*");
    revalidatePath("/");
    revalidatePath("/projects");
    revalidatePath("/admin/projects");
    return safeJson(project, { status: 201 });
  } catch {
    return errorJson("服务器错误", 500);
  }
}
