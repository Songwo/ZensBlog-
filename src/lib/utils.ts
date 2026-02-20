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

export function stripMarkdownToText(content: string): string {
  if (!content) return "";

  return content
    .replace(/\r\n/g, "\n")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/~~~[\s\S]*?~~~/g, " ")
    .replace(/^ {4,}.*$/gm, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/[*_~]/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildPostSummary(excerpt: string | null | undefined, content: string, maxLength = 160): string {
  const cleanExcerpt = stripMarkdownToText(excerpt || "");
  if (cleanExcerpt) {
    return cleanExcerpt.slice(0, maxLength);
  }
  const cleanContent = stripMarkdownToText(content);
  return cleanContent.slice(0, maxLength);
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

  const plainText = stripMarkdownToText(content);

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
