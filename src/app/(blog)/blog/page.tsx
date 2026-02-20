import { prisma } from "@/lib/db";
import { PostCard } from "@/components/blog/PostCard";
import { Pagination } from "@/components/blog/Pagination";
import { TagCloud } from "@/components/blog/TagCloud";
import { ArchiveSidebar } from "@/components/blog/ArchiveSidebar";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "文章" };

const PAGE_SIZE = 10;
type SortKey = "latest" | "hottest" | "most-liked";

function buildBasePath(q: string, sort: SortKey) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (sort !== "latest") params.set("sort", sort);
  const raw = params.toString();
  return raw ? `/blog?${raw}` : "/blog";
}

export default async function BlogListPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1"));
  const q = (params.q || "").trim();
  const sort = ((params.sort || "latest") as SortKey);

  const where = {
    published: true,
    status: "PUBLISHED" as const,
    hiddenByReports: false,
    type: "OFFICIAL" as const,
    ...(q
      ? {
          OR: [
            { title: { contains: q } },
            { excerpt: { contains: q } },
            { content: { contains: q } },
          ],
        }
      : {}),
  };

  const orderBy =
    sort === "most-liked"
      ? [{ likes: { _count: "desc" as const } }, { publishedAt: "desc" as const }]
      : [{ publishedAt: "desc" as const }];

  const postQuery: {
    where: typeof where;
    include: { category: true; tags: { include: { tag: true } }; _count: { select: { likes: true; comments: true } } };
    orderBy: typeof orderBy;
    skip?: number;
    take: number;
  } = {
    where,
    include: { category: true, tags: { include: { tag: true } }, _count: { select: { likes: true, comments: true } } },
    orderBy,
    take: PAGE_SIZE,
  };
  if (sort === "hottest") {
    postQuery.take = 200;
  } else {
    postQuery.skip = (page - 1) * PAGE_SIZE;
  }

  const [rawPosts, total, tags, archiveData] = await Promise.all([
    prisma.post.findMany(postQuery),
    prisma.post.count({ where }),
    prisma.tag.findMany({
      include: {
        _count: {
          select: {
            posts: {
              where: {
                post: { published: true, status: "PUBLISHED", hiddenByReports: false, type: "OFFICIAL" },
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.post.findMany({
      where: { published: true, status: "PUBLISHED", hiddenByReports: false, type: "OFFICIAL" },
      select: { publishedAt: true },
      orderBy: { publishedAt: "desc" },
    }),
  ]);

  const posts =
    sort === "hottest"
      ? [...rawPosts]
          .sort((a, b) => {
            const aScore = a.views + a._count.likes * 3 + a._count.comments * 2;
            const bScore = b.views + b._count.likes * 3 + b._count.comments * 2;
            return bScore - aScore;
          })
          .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
      : rawPosts;

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
    <div className="mx-auto w-full max-w-[1280px] px-4 py-12 sm:px-8 lg:px-12 fade-in-up">
      <h1 className="mb-8 text-center text-3xl font-bold text-[#111111] sm:text-4xl">所有文章</h1>

      <form className="mb-6 grid gap-3 rounded-xl border border-[#e5e7eb] bg-white/75 p-3 sm:grid-cols-[1fr_auto_auto]">
        <input
          name="q"
          defaultValue={q}
          placeholder="按标题/摘要/正文关键词筛选"
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
        />
        <select name="sort" defaultValue={sort} className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm">
          <option value="latest">最新</option>
          <option value="hottest">最热</option>
          <option value="most-liked">点赞最多</option>
        </select>
        <button type="submit" className="rounded-lg bg-accent px-4 py-2.5 text-sm text-white hover:opacity-90">
          筛选
        </button>
      </form>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="grid gap-6 sm:grid-cols-2">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
          {posts.length === 0 && <p className="py-12 text-center text-[#94a3b8]">暂无文章</p>}
          <div className="mt-8">
            <Pagination current={page} total={totalPages} basePath={buildBasePath(q, sort)} />
          </div>
        </div>

        <aside className="space-y-6">
          <TagCloud tags={tagList} />
          <ArchiveSidebar archives={archiveList} />
        </aside>
      </div>
    </div>
  );
}
