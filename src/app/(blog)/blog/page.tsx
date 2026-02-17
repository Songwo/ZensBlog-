import { prisma } from "@/lib/db";
import { PostCard } from "@/components/blog/PostCard";
import { Pagination } from "@/components/blog/Pagination";
import { TagCloud } from "@/components/blog/TagCloud";
import { ArchiveSidebar } from "@/components/blog/ArchiveSidebar";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "文章" };

const PAGE_SIZE = 10;

export default async function BlogListPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1"));

  const [posts, total, tags, archiveData] = await Promise.all([
    prisma.post.findMany({
      where: { published: true, type: "OFFICIAL" },
      include: { category: true, tags: { include: { tag: true } }, _count: { select: { likes: true, comments: true } } },
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.post.count({ where: { published: true, type: "OFFICIAL" } }),
    // 获取标签及其文章数
    prisma.tag.findMany({
      include: {
        _count: {
          select: {
            posts: {
              where: {
                post: { published: true, type: "OFFICIAL" },
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    }),
    // 获取归档数据（按年月分组）
    prisma.post.findMany({
      where: { published: true, type: "OFFICIAL" },
      select: { publishedAt: true },
      orderBy: { publishedAt: "desc" },
    }),
  ]);

  // 处理归档数据
  const archives = archiveData
    .filter((post) => post.publishedAt)
    .reduce((acc, post) => {
      const date = new Date(post.publishedAt!);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const key = `${year}-${month}`;

      if (!acc[key]) {
        acc[key] = { year, month, count: 0 };
      }
      acc[key].count++;
      return acc;
    }, {} as Record<string, { year: number; month: number; count: number }>);

  const archiveList = Object.values(archives).sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });

  const tagList = tags
    .map((tag) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      count: tag._count.posts,
    }))
    .filter((tag) => tag.count > 0)
    .sort((a, b) => b.count - a.count);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-8 lg:px-12 py-12 fade-in-up">
      <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-[#111111] text-center">所有文章</h1>

      <div className="grid lg:grid-cols-[1fr_320px] gap-8">
        {/* 主内容区 */}
        <div>
          <div className="grid sm:grid-cols-2 gap-6">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
          {posts.length === 0 && (
            <p className="text-[#94a3b8] text-center py-12">暂无文章</p>
          )}
          <div className="mt-8">
            <Pagination current={page} total={totalPages} basePath="/blog" />
          </div>
        </div>

        {/* 侧边栏 */}
        <aside className="space-y-6">
          <TagCloud tags={tagList} />
          <ArchiveSidebar archives={archiveList} />
        </aside>
      </div>
    </div>
  );
}
