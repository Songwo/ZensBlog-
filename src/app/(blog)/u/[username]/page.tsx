import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { AuthorCard } from "@/components/blog/AuthorCard";

type Props = {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ tab?: string; page?: string }>;
};

const PAGE_SIZE = 10;

export default async function UserProfilePage({ params, searchParams }: Props) {
  const { username } = await params;
  const query = await searchParams;
  const tab = (query.tab || "posts").toLowerCase();
  const page = Math.max(1, Number(query.page || 1));
  const skip = (page - 1) * PAGE_SIZE;

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      name: true,
      image: true,
      bio: true,
      title: true,
      about: true,
      company: true,
      location: true,
      blog: true,
      website: true,
      twitter: true,
      linkedin: true,
      githubProfile: true,
      activeBadge: { select: { id: true, name: true, icon: true, iconUrl: true, color: true } },
      githubFollowers: true,
      githubFollowing: true,
      githubPublicRepos: true,
      _count: {
        select: { posts: true, comments: true, likes: true },
      },
    },
  });

  if (!user) notFound();

  const receivedLikes = await prisma.postLike.count({
    where: { post: { authorId: user.id } },
  });

  if (tab === "comments") {
    const [total, comments] = await Promise.all([
      prisma.comment.count({ where: { userId: user.id } }),
      prisma.comment.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        skip,
        take: PAGE_SIZE,
        select: {
          id: true,
          content: true,
          createdAt: true,
          post: { select: { title: true, slug: true, type: true } },
        },
      }),
    ]);

    return (
      <ProfileLayout
        user={user}
        receivedLikes={receivedLikes}
        tab={tab}
        page={page}
        total={total}
        items={comments.map((c) => (
          <div key={c.id} className="rounded-lg border border-[#e2e8f0] p-3">
            <p className="text-sm text-[#334155]">{c.content}</p>
            <Link
              href={c.post.type === "COMMUNITY" ? `/community/${c.post.slug}` : `/blog/${c.post.slug}`}
              className="text-xs text-[#64748b] hover:text-[#111111] mt-1 inline-block"
            >
              来自：{c.post.title}
            </Link>
          </div>
        ))}
      />
    );
  }

  if (tab === "likes") {
    const [total, likes] = await Promise.all([
      prisma.postLike.count({ where: { userId: user.id } }),
      prisma.postLike.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        skip,
        take: PAGE_SIZE,
        select: {
          id: true,
          createdAt: true,
          post: { select: { title: true, slug: true, type: true, excerpt: true } },
        },
      }),
    ]);

    return (
      <ProfileLayout
        user={user}
        receivedLikes={receivedLikes}
        tab={tab}
        page={page}
        total={total}
        items={likes.map((like) => (
          <Link
            key={like.id}
            href={like.post.type === "COMMUNITY" ? `/community/${like.post.slug}` : `/blog/${like.post.slug}`}
            className="block rounded-lg border border-[#e2e8f0] p-3 hover:bg-[#f8fafc]"
          >
            <p className="text-sm font-medium text-[#111111]">{like.post.title}</p>
            <p className="text-xs text-[#64748b] mt-1">{like.post.excerpt || "暂无摘要"}</p>
          </Link>
        ))}
      />
    );
  }

  const [total, posts] = await Promise.all([
    prisma.post.count({ where: { authorId: user.id } }),
    prisma.post.findMany({
      where: { authorId: user.id },
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        type: true,
        published: true,
      },
    }),
  ]);

  return (
    <ProfileLayout
      user={user}
      receivedLikes={receivedLikes}
      tab={tab}
      page={page}
      total={total}
      items={posts.map((post) => (
        <Link
          key={post.id}
          href={post.type === "COMMUNITY" ? `/community/${post.slug}` : `/blog/${post.slug}`}
          className="block rounded-lg border border-[#e2e8f0] p-3 hover:bg-[#f8fafc]"
        >
          <p className="text-sm font-medium text-[#111111]">{post.title}</p>
          <p className="text-xs text-[#64748b] mt-1">{post.excerpt || "暂无摘要"}</p>
          <p className="text-[11px] text-[#94a3b8] mt-2">{post.published ? "已发布" : "草稿"}</p>
        </Link>
      ))}
    />
  );
}

function ProfileLayout({
  user,
  receivedLikes,
  tab,
  page,
  total,
  items,
}: {
  user: {
    username: string | null;
    name: string | null;
    image: string | null;
    activeBadge: { id: string; name: string; icon: string; iconUrl: string | null; color: string } | null;
    bio: string;
    title: string | null;
    about: string;
    company: string | null;
    location: string | null;
    blog: string | null;
    website: string | null;
    twitter: string | null;
    linkedin: string | null;
    githubProfile: string | null;
    githubFollowers: number;
    githubFollowing: number;
    githubPublicRepos: number;
    _count: { posts: number; comments: number; likes: number };
  };
  receivedLikes: number;
  tab: string;
  page: number;
  total: number;
  items: React.ReactNode[];
}) {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto w-full max-w-[980px] px-4 sm:px-8 py-12">
      <div className="rounded-xl border border-[#e2e8f0] bg-white/75 p-6">
        <div className="space-y-3">
          <AuthorCard
            name={user.name || user.username || "未命名用户"}
            username={user.username || "unknown"}
            image={user.image}
            title={user.title}
            bio={user.bio || null}
            badge={user.activeBadge}
            stats={[
              { label: "文章", value: user._count.posts },
              { label: "评论", value: user._count.comments },
              { label: "获赞", value: receivedLikes },
            ]}
          />
          {user.about && <p className="text-sm text-[#64748b]">{user.about}</p>}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#64748b]">
            {user.company && <span>公司: {user.company}</span>}
            {user.location && <span>位置: {user.location}</span>}
            {user.website && <a href={user.website} target="_blank" rel="noreferrer" className="hover:underline">网站</a>}
            {user.blog && <a href={user.blog} target="_blank" rel="noreferrer" className="hover:underline">Blog</a>}
            {user.githubProfile && <a href={user.githubProfile} target="_blank" rel="noreferrer" className="hover:underline">GitHub</a>}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[#e2e8f0] bg-white/70 p-6 mt-6">
        <div className="flex items-center gap-3 mb-4 text-sm">
          <Link href={`/u/${user.username}?tab=posts`} className={tab === "posts" ? "font-semibold text-[#111111]" : "text-[#64748b]"}>文章</Link>
          <Link href={`/u/${user.username}?tab=comments`} className={tab === "comments" ? "font-semibold text-[#111111]" : "text-[#64748b]"}>评论</Link>
          <Link href={`/u/${user.username}?tab=likes`} className={tab === "likes" ? "font-semibold text-[#111111]" : "text-[#64748b]"}>点赞</Link>
        </div>

        <div className="space-y-3">
          {items.length ? items : <p className="text-sm text-[#64748b]">暂无内容</p>}
        </div>

        <div className="mt-5 flex items-center justify-between text-sm">
          <Link
            href={`/u/${user.username}?tab=${tab}&page=${Math.max(1, page - 1)}`}
            className={`rounded-md border border-[#e2e8f0] px-3 py-1.5 ${(page <= 1) ? "pointer-events-none opacity-50" : ""}`}
          >
            上一页
          </Link>
          <span className="text-[#64748b]">{page} / {totalPages}</span>
          <Link
            href={`/u/${user.username}?tab=${tab}&page=${Math.min(totalPages, page + 1)}`}
            className={`rounded-md border border-[#e2e8f0] px-3 py-1.5 ${(page >= totalPages) ? "pointer-events-none opacity-50" : ""}`}
          >
            下一页
          </Link>
        </div>
      </div>
    </div>
  );
}
