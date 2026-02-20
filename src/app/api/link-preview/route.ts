import { checkRateLimit, errorJson, isValidHttpUrl, normalizeString, safeJson } from "@/lib/api";

type LinkPreview = {
  url: string;
  siteName: string;
  title: string;
  description: string;
  image: string;
  favicon: string;
  type: "github-repo" | "github-issue" | "github-pr" | "generic";
  extra?: Record<string, string | number | boolean>;
};

const memCache = new Map<string, { expiresAt: number; data: LinkPreview }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 2800;
const MAX_REDIRECTS = 3;

function getCached(url: string) {
  const hit = memCache.get(url);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    memCache.delete(url);
    return null;
  }
  return hit.data;
}

function setCached(url: string, data: LinkPreview) {
  memCache.set(url, { expiresAt: Date.now() + CACHE_TTL_MS, data });
}

function isBlockedHost(hostname: string) {
  const h = hostname.toLowerCase();
  if (!h) return true;
  if (h === "::1") return true;
  return (
    h === "localhost" ||
    h.endsWith(".local") ||
    h.startsWith("127.") ||
    h.startsWith("10.") ||
    h.startsWith("192.168.") ||
    h.startsWith("172.16.") ||
    h.startsWith("172.17.") ||
    h.startsWith("172.18.") ||
    h.startsWith("172.19.") ||
    h.startsWith("172.2") ||
    h.startsWith("169.254.")
  );
}

async function fetchWithLimit(rawUrl: string, init?: RequestInit) {
  let current = new URL(rawUrl);
  for (let i = 0; i <= MAX_REDIRECTS; i += 1) {
    if (current.protocol !== "http:" && current.protocol !== "https:") {
      throw new Error("invalid_protocol");
    }
    if (isBlockedHost(current.hostname)) throw new Error("blocked_host");

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const resp = await fetch(current.toString(), {
      ...init,
      signal: controller.signal,
      redirect: "manual",
    }).finally(() => clearTimeout(timer));

    if (resp.status >= 300 && resp.status < 400) {
      const location = resp.headers.get("location");
      if (!location) throw new Error("bad_redirect");
      current = new URL(location, current.toString());
      continue;
    }
    return { response: resp, finalUrl: current.toString() };
  }
  throw new Error("too_many_redirects");
}

function absUrl(base: string, maybe: string) {
  try {
    return new URL(maybe, base).toString();
  } catch {
    return "";
  }
}

function parseMeta(html: string, baseUrl: string) {
  const pick = (pattern: RegExp) => {
    const m = html.match(pattern);
    return m?.[1]?.trim() || "";
  };
  const title = pick(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
    || pick(/<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i)
    || pick(/<title[^>]*>([^<]+)<\/title>/i);
  const description = pick(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)
    || pick(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
    || pick(/<meta[^>]+name=["']twitter:description["'][^>]+content=["']([^"']+)["']/i);
  const image = pick(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
    || pick(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
  const siteName = pick(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i);
  const favicon =
    pick(/<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]+href=["']([^"']+)["']/i)
    || "/favicon.ico";
  return {
    title,
    description,
    image: absUrl(baseUrl, image),
    siteName,
    favicon: absUrl(baseUrl, favicon),
  };
}

function parseGitHubPath(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length < 2) return null;
  const [owner, repo, kind, id] = parts;
  if (!owner || !repo) return null;
  if (!kind) return { type: "repo" as const, owner, repo };
  if (kind === "issues" && id) return { type: "issue" as const, owner, repo, id };
  if (kind === "pull" && id) return { type: "pr" as const, owner, repo, id };
  return null;
}

async function fetchGitHubPreview(url: URL): Promise<LinkPreview | null> {
  const parsed = parseGitHubPath(url.pathname);
  if (!parsed) return null;
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "User-Agent": "zensblog-link-preview",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  if (parsed.type === "repo") {
    const res = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`, { headers, cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json() as Record<string, unknown>;
    return {
      url: url.toString(),
      siteName: "GitHub",
      title: String(data.full_name || `${parsed.owner}/${parsed.repo}`),
      description: String(data.description || ""),
      image: String((data.owner as Record<string, unknown> | undefined)?.avatar_url || ""),
      favicon: "https://github.com/favicon.ico",
      type: "github-repo",
      extra: {
        stars: Number(data.stargazers_count || 0),
        forks: Number(data.forks_count || 0),
        language: String(data.language || ""),
        updatedAt: String(data.updated_at || ""),
      },
    };
  }

  const issueRes = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}/issues/${parsed.id}`, { headers, cache: "no-store" });
  if (!issueRes.ok) return null;
  const issue = await issueRes.json() as Record<string, unknown>;
  return {
    url: url.toString(),
    siteName: "GitHub",
    title: String(issue.title || `${parsed.owner}/${parsed.repo}#${parsed.id}`),
    description: String(issue.body || "").slice(0, 260),
    image: String((issue.user as Record<string, unknown> | undefined)?.avatar_url || ""),
    favicon: "https://github.com/favicon.ico",
    type: parsed.type === "pr" ? "github-pr" : "github-issue",
    extra: {
      status: String(issue.state || ""),
      comments: Number(issue.comments || 0),
      number: String(issue.number || parsed.id),
    },
  };
}

async function fetchGenericPreview(url: URL): Promise<LinkPreview> {
  const { response: resp, finalUrl } = await fetchWithLimit(url.toString(), {
    headers: { "User-Agent": "zensblog-link-preview" },
    cache: "no-store",
  });
  if (!resp.ok) throw new Error("fetch_failed");
  const html = await resp.text();
  const meta = parseMeta(html, finalUrl);
  const final = new URL(finalUrl);
  return {
    url: finalUrl,
    siteName: meta.siteName || final.hostname,
    title: meta.title || final.hostname,
    description: meta.description || "",
    image: meta.image || "",
    favicon: meta.favicon || `${final.origin}/favicon.ico`,
    type: "generic",
  };
}

export async function GET(request: Request) {
  const rate = await checkRateLimit(request, { namespace: "api-link-preview", limit: 80, windowMs: 60_000 });
  if (!rate.allowed) return errorJson("请求过于频繁，请稍后再试", 429);

  const { searchParams } = new URL(request.url);
  const raw = normalizeString(searchParams.get("url") || "", 1500);
  if (!raw || !isValidHttpUrl(raw)) return errorJson("url 参数不合法", 400);

  const url = new URL(raw);
  if (isBlockedHost(url.hostname)) return errorJson("目标地址不允许访问", 400);

  const cached = getCached(url.toString());
  if (cached) return safeJson(cached);

  try {
    let result: LinkPreview | null = null;
    if (url.hostname.toLowerCase() === "github.com") {
      result = await fetchGitHubPreview(url);
    }
    if (!result) {
      result = await fetchGenericPreview(url);
    }
    setCached(url.toString(), result);
    return safeJson(result);
  } catch {
    return safeJson({
      url: url.toString(),
      siteName: url.hostname,
      title: url.hostname,
      description: "",
      image: "",
      favicon: `${url.origin}/favicon.ico`,
      type: "generic",
    } as LinkPreview);
  }
}
