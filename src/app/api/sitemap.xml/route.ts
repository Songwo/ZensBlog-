import { prisma } from "@/lib/db";
import { isValidHttpUrl } from "@/lib/api";

export async function GET() {
  const posts = await prisma.post.findMany({
    where: { published: true, type: "OFFICIAL" },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });
  const communityPosts = await prisma.post.findMany({
    where: { published: true, type: "COMMUNITY" },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });

  const categories = await prisma.category.findMany({
    select: { slug: true },
  });

  const siteConfig = await prisma.siteConfig.findFirst({ where: { key: "siteUrl" } });
  const configuredSiteUrl = siteConfig?.value || "";
  const siteUrl = isValidHttpUrl(configuredSiteUrl) ? configuredSiteUrl : "https://zensblog.dev";

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${siteUrl}/blog</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${siteUrl}/archives</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${siteUrl}/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${siteUrl}/community</loc>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>
  ${categories
    .map(
      (cat) => `
  <url>
    <loc>${siteUrl}/category/${cat.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`
    )
    .join("")}
  ${posts
    .map(
      (post) => `
  <url>
    <loc>${siteUrl}/blog/${post.slug}</loc>
    <lastmod>${post.updatedAt.toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`
    )
    .join("")}
  ${communityPosts
    .map(
      (post) => `
  <url>
    <loc>${siteUrl}/community/${post.slug}</loc>
    <lastmod>${post.updatedAt.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`
    )
    .join("")}
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
