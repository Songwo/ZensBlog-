import { prisma } from "@/lib/db";
import { CyberHome } from "@/components/blog/CyberHome";
import { getSiteSettings } from "@/lib/site-config";

export default async function HomePage() {
  const settings = await getSiteSettings();

  const pinnedPost = await prisma.post.findFirst({
    where: { published: true, status: "PUBLISHED", hiddenByReports: false, pinned: true, type: "OFFICIAL" },
    include: { category: true, tags: { include: { tag: true } }, _count: { select: { likes: true, comments: true } } },
    orderBy: { publishedAt: "desc" },
  });

  const recentPosts = await prisma.post.findMany({
    where: {
      published: true,
      status: "PUBLISHED",
      hiddenByReports: false,
      type: "OFFICIAL",
      ...(pinnedPost ? { id: { not: pinnedPost.id } } : {}),
    },
    include: { category: true, tags: { include: { tag: true } }, _count: { select: { likes: true, comments: true } } },
    orderBy: { publishedAt: "desc" },
    take: 6,
  });

  const categories = await prisma.category.findMany({
    include: { _count: { select: { posts: { where: { published: true, type: "OFFICIAL" } } } } },
    orderBy: { sortOrder: "asc" },
  });

  const featuredProjects = await prisma.project.findMany({
    where: { published: true, featured: true },
    orderBy: { sortOrder: "asc" },
    take: 3,
  });

  const featuredFriends = await prisma.friendLink.findMany({
    where: { featured: true },
    orderBy: { sortOrder: "asc" },
    take: 6,
  });

  const owner = await prisma.user.findFirst({
    where: {
      OR: [{ role: "ADMIN" }, { posts: { some: { published: true } } }],
    },
    orderBy: [{ role: "desc" }, { createdAt: "asc" }],
    select: {
      name: true,
      bio: true,
      image: true,
      githubProfile: true,
      email: true,
      website: true,
      _count: { select: { posts: true, comments: true } },
      posts: { where: { published: true }, select: { views: true } },
    },
  });

  return (
    <CyberHome
      effectsLevel={settings.effectsLevel}
      siteName={settings.siteName}
      siteDescription={settings.siteDescription}
      pinnedPost={
        pinnedPost
          ? {
              id: pinnedPost.id,
              title: pinnedPost.title,
              slug: pinnedPost.slug,
              excerpt: pinnedPost.excerpt,
              coverImage: pinnedPost.coverImage,
              publishedAt: pinnedPost.publishedAt?.toISOString() ?? null,
              views: pinnedPost.views,
              likes: pinnedPost._count.likes,
              comments: pinnedPost._count.comments,
              category: pinnedPost.category
                ? { name: pinnedPost.category.name, slug: pinnedPost.category.slug }
                : null,
              tags: pinnedPost.tags.map((t) => ({ name: t.tag.name, slug: t.tag.slug })),
            }
          : null
      }
      recentPosts={recentPosts.map((post) => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        coverImage: post.coverImage,
        publishedAt: post.publishedAt?.toISOString() ?? null,
        views: post.views,
        likes: post._count.likes,
        comments: post._count.comments,
        category: post.category ? { name: post.category.name, slug: post.category.slug } : null,
        tags: post.tags.map((t) => ({ name: t.tag.name, slug: t.tag.slug })),
      }))}
      categories={categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        postCount: cat._count.posts,
      }))}
      featuredProjects={featuredProjects.map((project) => ({
        id: project.id,
        title: project.title,
        slug: project.slug,
        description: project.description,
        coverImage: project.coverImage,
        demoUrl: project.demoUrl,
        githubUrl: project.githubUrl,
        tags: project.tags ? project.tags.split(",").filter(Boolean) : [],
      }))}
      featuredFriends={featuredFriends.map((friend) => ({
        id: friend.id,
        name: friend.name,
        description: friend.description,
        url: friend.url,
        avatar: friend.avatar,
      }))}
      authorProfile={
        owner
          ? {
              name: owner.name || settings.siteName || "博主",
              bio: owner.bio || settings.siteDescription || "",
              image: owner.image || null,
              githubProfile: owner.githubProfile || null,
              email: owner.email || null,
              website: owner.website || null,
              stats: {
                posts: owner._count.posts,
                comments: owner._count.comments,
                views: owner.posts.reduce((sum, post) => sum + post.views, 0),
              },
            }
          : {
              name: settings.siteName || "博主",
              bio: settings.siteDescription || "",
              image: null,
              githubProfile: null,
              email: null,
              website: null,
              stats: { posts: 0, comments: 0, views: 0 },
            }
      }
    />
  );
}
