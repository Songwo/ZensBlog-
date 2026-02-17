import { searchPosts } from "@/lib/search";
import { checkRateLimit, errorJson, normalizeString, safeJson } from "@/lib/api";

export async function GET(request: Request) {
  const rate = await checkRateLimit(request, { namespace: "api-search", limit: 90, windowMs: 60_000 });
  if (!rate.allowed) return errorJson("搜索过于频繁，请稍后再试", 429);

  const { searchParams } = new URL(request.url);
  const q = normalizeString(searchParams.get("q") || "", 80);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(50, parseInt(searchParams.get("limit") || "20"));

  if (!q.trim()) {
    return safeJson({ results: [], total: 0, query: "" });
  }

  const results = await searchPosts(q, limit);

  return safeJson({ results, total: results.length, query: q });
}
