import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getNowItems } from "@/lib/content-pages";
import {
  checkRateLimit,
  errorJson,
  isSameOrigin,
  requireAdminSession,
  safeJson,
} from "@/lib/api";

export async function GET() {
  const items = await getNowItems();
  return safeJson({ items });
}

export async function PUT(request: Request) {
  const session = await requireAdminSession();
  if (!session) return errorJson("未授权", 401);
  if (!isSameOrigin(request)) return errorJson("非法来源请求", 403);

  const rate = await checkRateLimit(request, { namespace: "api-now-update", limit: 30, windowMs: 60_000 });
  if (!rate.allowed) return errorJson("请求过于频繁，请稍后再试", 429);

  try {
    const data: unknown = await request.json();
    if (!data || typeof data !== "object" || Array.isArray(data)) return errorJson("请求体格式错误", 400);
    const payload = data as { items?: unknown };
    if (!Array.isArray(payload.items)) return errorJson("items 必须是数组", 400);

    const items = payload.items
      .map((item, index) => {
        const row = item as Record<string, unknown>;
        const title = typeof row.title === "string" ? row.title.trim().slice(0, 120) : "";
        const content = typeof row.content === "string" ? row.content.trim().slice(0, 800) : "";
        const status = typeof row.status === "string" ? row.status.trim().slice(0, 20) : "计划中";
        if (!title || !content) return null;
        return {
          id: typeof row.id === "string" && row.id.trim() ? row.id.trim() : `now-${index + 1}`,
          title,
          content,
          status,
        };
      })
      .filter(Boolean);

    await prisma.siteConfig.upsert({
      where: { key: "nowItems" },
      create: { key: "nowItems", value: JSON.stringify(items) },
      update: { value: JSON.stringify(items) },
    });

    revalidatePath("/now");
    revalidatePath("/admin/now");
    return safeJson({ success: true, items });
  } catch {
    return errorJson("服务器错误", 500);
  }
}

