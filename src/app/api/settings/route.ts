import { prisma } from "@/lib/db";
import { cache, cacheKey } from "@/lib/cache";
import { revalidatePath, revalidateTag } from "next/cache";
import {
  ALLOWED_CONFIG_KEYS,
  checkRateLimit,
  errorJson,
  isSameOrigin,
  isValidHttpUrl,
  requireAdminSession,
  safeJson,
} from "@/lib/api";

const EFFECTS_LEVELS = new Set(["low", "medium", "ultra"]);

function validateConfigValue(key: string, value: unknown) {
  if (typeof value !== "string") return false;
  const normalized = value.trim();

  if (key === "siteName") return normalized.length >= 1 && normalized.length <= 120;
  if (key === "siteDescription") return normalized.length <= 300;
  if (key === "authorName") return normalized.length >= 1 && normalized.length <= 80;
  if (key === "siteUrl") return normalized.length <= 200 && isValidHttpUrl(normalized);
  if (key === "effectsLevel") return EFFECTS_LEVELS.has(normalized);
  if (key === "rewardText") return normalized.length <= 120;
  if (key === "adTitle") return normalized.length <= 80;
  if (key === "adDescription") return normalized.length <= 200;
  if (key === "rewardQrImage" || key === "adImage" || key === "adLink") {
    return normalized.length === 0 || (normalized.length <= 500 && isValidHttpUrl(normalized));
  }
  return false;
}

export async function GET() {
  const key = cacheKey("settings:all");
  const cached = cache.get(key);
  if (cached) return safeJson(cached);

  const configs = await prisma.siteConfig.findMany({
    where: { key: { in: [...ALLOWED_CONFIG_KEYS] } },
  });

  const configMap = Object.fromEntries(configs.map((c) => [c.key, c.value]));
  const result = {
    siteName: configMap.siteName || "Zen's Blog",
    siteDescription: configMap.siteDescription || "",
    siteUrl: configMap.siteUrl || "https://zensblog.dev",
    authorName: configMap.authorName || "Zen",
    effectsLevel: configMap.effectsLevel || "medium",
    rewardQrImage: configMap.rewardQrImage || "",
    rewardText: configMap.rewardText || "感谢你的支持，继续输出高质量内容。",
    adTitle: configMap.adTitle || "广告位",
    adDescription: configMap.adDescription || "赞助位（300 x 250）",
    adImage: configMap.adImage || "",
    adLink: configMap.adLink || "",
  };

  cache.set(key, result, 600);
  return safeJson(result);
}

export async function PUT(request: Request) {
  const session = await requireAdminSession();
  if (!session) return errorJson("未授权", 401);
  if (!isSameOrigin(request)) return errorJson("非法来源请求", 403);
  const rate = await checkRateLimit(request, { namespace: "api-settings-update", limit: 20, windowMs: 60_000 });
  if (!rate.allowed) return errorJson("请求过于频繁，请稍后再试", 429);

  let data: unknown;
  try {
    data = await request.json();
  } catch {
    return errorJson("请求体格式错误", 400);
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return errorJson("请求体格式错误", 400);
  }

  const entries = Object.entries(data).filter(([key]) =>
    ALLOWED_CONFIG_KEYS.includes(key as (typeof ALLOWED_CONFIG_KEYS)[number]),
  );
  if (!entries.length) return errorJson("没有可更新的设置项", 400);

  for (const [key, value] of entries) {
    if (!validateConfigValue(key, value)) {
      return errorJson(`设置项 ${key} 不合法`, 400);
    }
  }

  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.siteConfig.upsert({
        where: { key },
        update: { value: (value as string).trim() },
        create: { key, value: (value as string).trim() },
      }),
    ),
  );

  cache.delete(cacheKey("settings:all"));
  revalidateTag("site-settings");
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath("/about");
  revalidatePath("/blog/[slug]", "page");
  return safeJson({ success: true });
}
