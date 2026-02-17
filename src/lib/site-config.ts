import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";

export interface SiteSettings {
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  authorName: string;
  effectsLevel: "low" | "medium" | "ultra";
}

const DEFAULT_SETTINGS: SiteSettings = {
  siteName: "Zen's Blog",
  siteDescription: "一个关于技术、设计与生活的个人博客",
  siteUrl: "https://zensblog.dev",
  authorName: "Zen",
  effectsLevel: "medium",
};

const loadSiteSettings = unstable_cache(
  async (): Promise<SiteSettings> => {
    const configs = await prisma.siteConfig.findMany({
      where: {
        key: {
          in: ["siteName", "siteDescription", "siteUrl", "authorName", "effectsLevel"],
        },
      },
    });

    const configMap = Object.fromEntries(configs.map((item) => [item.key, item.value]));
    const effectsLevel =
      configMap.effectsLevel === "low" || configMap.effectsLevel === "ultra"
        ? configMap.effectsLevel
        : "medium";

    return {
      siteName: configMap.siteName || DEFAULT_SETTINGS.siteName,
      siteDescription: configMap.siteDescription || DEFAULT_SETTINGS.siteDescription,
      siteUrl: configMap.siteUrl || DEFAULT_SETTINGS.siteUrl,
      authorName: configMap.authorName || DEFAULT_SETTINGS.authorName,
      effectsLevel,
    };
  },
  ["site-settings"],
  { tags: ["site-settings"], revalidate: 300 },
);

export async function getSiteSettings() {
  return loadSiteSettings();
}
