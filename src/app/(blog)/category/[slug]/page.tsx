import { prisma } from "@/lib/db";
import { PostCard } from "@/components/blog/PostCard";
import { Pagination } from "@/components/blog/Pagination";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

const PAGE_SIZE = 10;

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) return {};
  return { title: `${category.name} - 分类` };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page || "1"));

  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) notFound();

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: { published: true, status: "PUBLISHED", hiddenByReports: false, categoryId: category.id, type: "OFFICIAL" },
      include: { category: true, tags: { include: { tag: true } }, _count: { select: { likes: true, comments: true } } },
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.post.count({ where: { published: true, status: "PUBLISHED", hiddenByReports: false, categoryId: category.id, type: "OFFICIAL" } }),
  ]);

  return (
    <div className="cyber-page-shell">
      <h1 className="font-heading text-2xl sm:text-3xl font-bold mb-2 cyber-page-title">
        分类：{category.name}
      </h1>
      <p className="text-cyan-200/70 mb-8">{total} 篇文章</p>
      <div className="grid sm:grid-cols-2 gap-8">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
      <Pagination current={page} total={Math.ceil(total / PAGE_SIZE)} basePath={`/category/${slug}`} />
    </div>
  );
}
