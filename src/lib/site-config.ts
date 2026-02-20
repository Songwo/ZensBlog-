import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";

export interface SiteSettings {
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  authorName: string;
  effectsLevel: "low" | "medium" | "ultra";
  rewardQrImage: string;
  rewardText: string;
  adTitle: string;
  adDescription: string;
  adImage: string;
  adLink: string;
}

const DEFAULT_SETTINGS: SiteSettings = {
  siteName: "Zen's Blog",
  siteDescription: "一个关于技术、设计与生活的个人博客",
  siteUrl: "https://zensblog.dev",
  authorName: "Zen",
  effectsLevel: "medium",
  rewardQrImage: "",
  rewardText: "感谢你的支持，继续输出高质量内容。",
  adTitle: "广告位",
  adDescription: "赞助位（300 x 250）",
  adImage: "",
  adLink: "",
};

const loadSiteSettings = unstable_cache(
  async (): Promise<SiteSettings> => {
    try {
      const configs = await prisma.siteConfig.findMany({
        where: {
          key: {
            in: [
              "siteName",
              "siteDescription",
              "siteUrl",
              "authorName",
              "effectsLevel",
              "rewardQrImage",
              "rewardText",
              "adTitle",
              "adDescription",
              "adImage",
              "adLink",
            ],
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
        rewardQrImage: configMap.rewardQrImage || DEFAULT_SETTINGS.rewardQrImage,
        rewardText: configMap.rewardText || DEFAULT_SETTINGS.rewardText,
        adTitle: configMap.adTitle || DEFAULT_SETTINGS.adTitle,
        adDescription: configMap.adDescription || DEFAULT_SETTINGS.adDescription,
        adImage: configMap.adImage || DEFAULT_SETTINGS.adImage,
        adLink: configMap.adLink || DEFAULT_SETTINGS.adLink,
      };
    } catch {
      return DEFAULT_SETTINGS;
    }
  },
  ["site-settings"],
  { tags: ["site-settings"], revalidate: 300 },
);

export async function getSiteSettings() {
  return loadSiteSettings();
}
