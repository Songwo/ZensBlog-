import { prisma } from "@/lib/db";

export type LabStatus = "计划中" | "进行中" | "已完成";

export interface LabItem {
  id: string;
  name: string;
  desc: string;
  status: LabStatus;
  articleSlug?: string;
  sourceUrl?: string;
}

export interface NowItem {
  id: string;
  title: string;
  content: string;
  status: LabStatus;
}

export const DEFAULT_LAB_ITEMS: LabItem[] = [
  {
    id: "lab-1",
    name: "排序可视化",
    desc: "用柱状图展示冒泡、快速排序过程",
    status: "已完成",
    articleSlug: "sorting-visualization-principles",
    sourceUrl: "https://github.com/yourname/zensblog/tree/main/src/components/blog/LabInteractiveDemos.tsx",
  },
  {
    id: "lab-2",
    name: "CSS 物理弹簧",
    desc: "不同阻尼参数下的交互动效对比",
    status: "进行中",
    articleSlug: "spring-motion-notes",
    sourceUrl: "https://github.com/yourname/zensblog/tree/main/src/components/blog",
  },
  {
    id: "lab-3",
    name: "调色板生成器",
    desc: "基于主题色自动生成 UI 色阶",
    status: "计划中",
    articleSlug: "color-system-for-zenlab",
    sourceUrl: "https://github.com/yourname/zensblog/tree/main/src/components/blog/LabInteractiveDemos.tsx",
  },
];

export const DEFAULT_NOW_ITEMS: NowItem[] = [
  { id: "now-1", title: "正在钻研技术栈", content: "最近在沉迷 Rust + WebAssembly，并尝试把一部分逻辑迁移到更高性能模块。", status: "进行中" },
  { id: "now-2", title: "正在阅读", content: "《Designing Data-Intensive Applications》+ 前端架构相关资料。", status: "进行中" },
  { id: "now-3", title: "正在听", content: "Syntax.fm、软技能工程师访谈、产品与工程协作播客。", status: "进行中" },
  { id: "now-4", title: "上次版本更新", content: "已完成 Spotlight 搜索、动态 OG 图、LAB/Now 后台可编辑。", status: "已完成" },
];

function safeParseJsonArray<T>(value: string | null, fallback: T[]): T[] {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return fallback;
    return parsed as T[];
  } catch {
    return fallback;
  }
}

export async function getLabItems() {
  const row = await prisma.siteConfig.findUnique({ where: { key: "labItems" } });
  const items = safeParseJsonArray<LabItem>(row?.value || null, DEFAULT_LAB_ITEMS);
  return items.filter((item) => item && item.name && item.desc);
}

export async function getNowItems() {
  const row = await prisma.siteConfig.findUnique({ where: { key: "nowItems" } });
  const items = safeParseJsonArray<NowItem>(row?.value || null, DEFAULT_NOW_ITEMS);
  return items.filter((item) => item && item.title && item.content);
}
