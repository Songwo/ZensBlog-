import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getLabItems } from "@/lib/content-pages";
import {
  checkRateLimit,
  errorJson,
  isSameOrigin,
  requireAdminSession,
  safeJson,
} from "@/lib/api";

export async function GET() {
  const items = await getLabItems();
  return safeJson({ items });
}

export async function PUT(request: Request) {
  const session = await requireAdminSession();
  if (!session) return errorJson("未授权", 401);
  if (!isSameOrigin(request)) return errorJson("非法来源请求", 403);

  const rate = await checkRateLimit(request, { namespace: "api-lab-update", limit: 30, windowMs: 60_000 });
  if (!rate.allowed) return errorJson("请求过于频繁，请稍后再试", 429);

  try {
    const data: unknown = await request.json();
    if (!data || typeof data !== "object" || Array.isArray(data)) return errorJson("请求体格式错误", 400);
    const payload = data as { items?: unknown };
    if (!Array.isArray(payload.items)) return errorJson("items 必须是数组", 400);

    const items = payload.items
      .map((item, index) => {
        const row = item as Record<string, unknown>;
        const name = typeof row.name === "string" ? row.name.trim().slice(0, 120) : "";
        const desc = typeof row.desc === "string" ? row.desc.trim().slice(0, 400) : "";
        const status = typeof row.status === "string" ? row.status.trim().slice(0, 20) : "计划中";
        const articleSlug = typeof row.articleSlug === "string" ? row.articleSlug.trim().slice(0, 180) : "";
        const sourceUrl = typeof row.sourceUrl === "string" ? row.sourceUrl.trim().slice(0, 500) : "";
        if (!name || !desc) return null;
        return {
          id: typeof row.id === "string" && row.id.trim() ? row.id.trim() : `lab-${index + 1}`,
          name,
          desc,
          status,
          articleSlug,
          sourceUrl,
        };
      })
      .filter(Boolean);

    await prisma.siteConfig.upsert({
      where: { key: "labItems" },
      create: { key: "labItems", value: JSON.stringify(items) },
      update: { value: JSON.stringify(items) },
    });

    revalidatePath("/lab");
    revalidatePath("/admin/lab");
    return safeJson({ success: true, items });
  } catch {
    return errorJson("服务器错误", 500);
  }
}
