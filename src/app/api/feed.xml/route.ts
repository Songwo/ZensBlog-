import { prisma } from "@/lib/db";
import { isValidHttpUrl } from "@/lib/api";

export async function GET() {
  const [posts, siteConfig] = await Promise.all([
    prisma.post.findMany({
      where: { published: true, type: "OFFICIAL" },
      select: {
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        coverImage: true,
        publishedAt: true,
        category: { select: { name: true } },
      },
      orderBy: { publishedAt: "desc" },
      take: 20,
    }),
    prisma.siteConfig.findMany(),
  ]);

  const config = Object.fromEntries(siteConfig.map((c) => [c.key, c.value]));
  const siteUrl = isValidHttpUrl(config.siteUrl || "") ? config.siteUrl : "https://zensblog.dev";
  const siteName = config.siteName || "Zen's Blog";
  const siteDescription = config.siteDescription || "Build · Ship · Think · Repeat";
  const authorName = config.authorName || "Zen";

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(siteName)}</title>
    <link>${siteUrl}</link>
    <description>${escapeXml(siteDescription)}</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/api/feed.xml" rel="self" type="application/rss+xml"/>
    <generator>ZensBlog</generator>
    ${posts
      .map(
        (post) => `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${siteUrl}/blog/${post.slug}</link>
      <guid isPermaLink="true">${siteUrl}/blog/${post.slug}</guid>
      <description>${escapeXml(post.excerpt)}</description>
      <content:encoded><![CDATA[${post.content}]]></content:encoded>
      <dc:creator>${escapeXml(authorName)}</dc:creator>
      ${post.category ? `<category>${escapeXml(post.category.name)}</category>` : ""}
      ${post.coverImage ? `<enclosure url="${siteUrl}${post.coverImage}" type="image/jpeg"/>` : ""}
      <pubDate>${post.publishedAt ? new Date(post.publishedAt).toUTCString() : ""}</pubDate>
    </item>`
      )
      .join("")}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
