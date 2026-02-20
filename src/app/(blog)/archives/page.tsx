import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "归档" };

export default async function ArchivesPage() {
  const posts = await prisma.post.findMany({
    where: { published: true, status: "PUBLISHED", hiddenByReports: false, type: "OFFICIAL" },
    select: { title: true, slug: true, publishedAt: true, category: { select: { name: true, slug: true } } },
    orderBy: { publishedAt: "desc" },
  });

  // Group by year
  const grouped: Record<string, typeof posts> = {};
  for (const post of posts) {
    const year = post.publishedAt ? new Date(post.publishedAt).getFullYear().toString() : "未分类";
    if (!grouped[year]) grouped[year] = [];
    grouped[year].push(post);
  }

  return (
    <div className="cyber-page-shell">
      <h1 className="font-heading text-2xl sm:text-3xl font-bold mb-8 cyber-page-title">归档</h1>
      <p className="text-cyan-200/70 mb-8">共 {posts.length} 篇文章</p>
      <div className="space-y-10">
        {Object.entries(grouped)
          .sort(([a], [b]) => Number(b) - Number(a))
          .map(([year, yearPosts]) => (
            <section key={year}>
              <h2 className="font-heading text-xl font-bold mb-4 text-cyan-100">{year}</h2>
              <ul className="space-y-3 border-l-2 border-cyan-200/20 pl-6">
                {yearPosts.map((post) => (
                  <li key={post.slug} className="relative">
                    <span className="absolute -left-[31px] top-2 w-2.5 h-2.5 rounded-full bg-cyan-300/40" />
                    <Link href={`/blog/${post.slug}`} className="group block shock-link">
                      <time className="text-xs text-cyan-200/70">{formatDate(post.publishedAt)}</time>
                      <h3 className="text-base text-cyan-100 group-hover:text-white transition-colors">{post.title}</h3>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
      </div>
    </div>
  );
}
