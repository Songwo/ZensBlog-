import { prisma } from "@/lib/db";
import { cache, cacheKey } from "@/lib/cache";
import { revalidatePath } from "next/cache";
import {
  checkRateLimit,
  errorJson,
  isSameOrigin,
  isValidHttpUrl,
  normalizeString,
  requireAdminSession,
  safeJson,
} from "@/lib/api";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const friend = await prisma.friendLink.findUnique({ where: { id } });
  if (!friend) return errorJson("友链不存在", 404);

  return safeJson(friend);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession();
  if (!session) return errorJson("未授权", 401);
  if (!isSameOrigin(request)) return errorJson("非法来源请求", 403);

  const rate = await checkRateLimit(request, { namespace: "api-friend-update", limit: 60, windowMs: 60_000 });
  if (!rate.allowed) return errorJson("请求过于频繁，请稍后再试", 429);

  const { id } = await params;

  try {
    const existing = await prisma.friendLink.findUnique({ where: { id } });
    if (!existing) return errorJson("友链不存在", 404);

    const data: unknown = await request.json();
    if (!data || typeof data !== "object" || Array.isArray(data)) return errorJson("请求体格式错误", 400);

    const payload = data as Record<string, unknown>;
    const name = normalizeString(payload.name, 100);
    const description = normalizeString(payload.description, 500);
    const url = normalizeString(payload.url, 500);
    const avatar = normalizeString(payload.avatar, 500);
    const featured = Boolean(payload.featured);
    const sortOrder = typeof payload.sortOrder === "number" ? payload.sortOrder : existing.sortOrder;

    if (!name || !url) return errorJson("缺少必填字段", 400);
    if (!isValidHttpUrl(url)) return errorJson("链接地址不合法", 400);
    if (avatar && !avatar.startsWith("/uploads/") && !isValidHttpUrl(avatar)) {
      return errorJson("头像地址不合法", 400);
    }

    const friend = await prisma.friendLink.update({
      where: { id },
      data: {
        name,
        description: description || "",
        url,
        avatar: avatar || "",
        featured,
        sortOrder,
      },
    });

    cache.delete(cacheKey("friends:list"));
    revalidatePath("/");
    revalidatePath("/friends");
    revalidatePath("/admin/friends");
    return safeJson(friend);
  } catch {
    return errorJson("服务器错误", 500);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession();
  if (!session) return errorJson("未授权", 401);
  if (!isSameOrigin(request)) return errorJson("非法来源请求", 403);

  const rate = await checkRateLimit(request, { namespace: "api-friend-delete", limit: 30, windowMs: 60_000 });
  if (!rate.allowed) return errorJson("请求过于频繁，请稍后再试", 429);

  const { id } = await params;

  try {
    const existing = await prisma.friendLink.findUnique({ where: { id } });
    if (!existing) return errorJson("友链不存在", 404);

    await prisma.friendLink.delete({ where: { id } });

    cache.delete(cacheKey("friends:list"));
    revalidatePath("/");
    revalidatePath("/friends");
    revalidatePath("/admin/friends");
    return safeJson({ success: true });
  } catch {
    return errorJson("服务器错误", 500);
  }
}
