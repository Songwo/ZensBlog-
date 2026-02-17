import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: Date | string | null): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function getPageRange(current: number, total: number): number[] {
  const range: number[] = [];
  const start = Math.max(1, current - 2);
  const end = Math.min(total, current + 2);
  for (let i = start; i <= end; i++) range.push(i);
  return range;
}

/**
 * 计算文章阅读时长
 * @param content 文章内容（Markdown 或纯文本）
 * @returns 预计阅读时长（分钟）
 */
export function calculateReadingTime(content: string): number {
  if (!content) return 1;

  // 移除 Markdown 语法
  const plainText = content
    .replace(/```[\s\S]*?```/g, "") // 代码块
    .replace(/`[^`]+`/g, "") // 行内代码
    .replace(/!\[.*?\]\(.*?\)/g, "") // 图片
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1") // 链接
    .replace(/#{1,6}\s/g, "") // 标题
    .replace(/[*_~`]/g, "") // 格式化符号
    .replace(/\n+/g, " "); // 换行

  // 计算字数
  const chineseChars = (plainText.match(/[\u4e00-\u9fff]/g) || []).length;
  const englishWords = (plainText.match(/[a-zA-Z]+/g) || []).length;

  // 中文：300字/分钟，英文：200词/分钟
  const minutes = Math.ceil((chineseChars / 300) + (englishWords / 200));

  return Math.max(1, minutes);
}

/**
 * 格式化阅读时长显示
 * @param minutes 分钟数
 * @returns 格式化的字符串
 */
export function formatReadingTime(minutes: number): string {
  if (minutes < 1) return "1 分钟";
  if (minutes === 1) return "1 分钟";
  return `${minutes} 分钟`;
}
