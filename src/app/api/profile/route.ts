import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { checkRateLimit, errorJson, isSameOrigin, normalizeString, safeJson } from "@/lib/api";
import { awardBadgesForUser } from "@/lib/badges";

function paginationFromUrl(url: string) {
  const { searchParams } = new URL(url);
  const tab = (searchParams.get("tab") || "posts").toLowerCase();
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = Math.min(20, Math.max(1, Number(searchParams.get("pageSize") || 8)));
  const skip = (page - 1) * pageSize;
  return { tab, page, pageSize, skip };
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return errorJson("未授权", 401);
  await awardBadgesForUser(session.user.id);
  const { tab, page, pageSize, skip } = paginationFromUrl(request.url);

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
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
      githubFollowers: true,
      githubFollowing: true,
      githubPublicRepos: true,
      activeBadgeId: true,
      userBadges: { include: { badge: true } },
    },
  });
  if (!user) return errorJson("用户不存在", 404);

  const [postCount, commentCount, receivedLikes] = await Promise.all([
    prisma.post.count({ where: { authorId: user.id } }),
    prisma.comment.count({ where: { userId: user.id } }),
    prisma.postLike.count({ where: { post: { authorId: user.id } } }),
  ]);

  if (tab === "comments") {
    const [total, comments] = await Promise.all([
      prisma.comment.count({ where: { userId: user.id } }),
      prisma.comment.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        select: {
          id: true,
          content: true,
          createdAt: true,
          post: { select: { id: true, title: true, slug: true, type: true } },
        },
      }),
    ]);

    return safeJson({
      profile: user,
      stats: { postCount, commentCount, receivedLikes },
      badges: user.userBadges.map((item) => item.badge),
      history: {
        tab,
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
        items: comments,
      },
    });
  }

  if (tab === "likes") {
    const [total, likes] = await Promise.all([
      prisma.postLike.count({ where: { userId: user.id } }),
      prisma.postLike.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        select: {
          id: true,
          createdAt: true,
          post: {
            select: {
              id: true,
              title: true,
              slug: true,
              excerpt: true,
              publishedAt: true,
              type: true,
            },
          },
        },
      }),
    ]);

    return safeJson({
      profile: user,
      stats: { postCount, commentCount, receivedLikes },
      badges: user.userBadges.map((item) => item.badge),
      history: {
        tab,
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
        items: likes,
      },
    });
  }

  const [total, posts] = await Promise.all([
    prisma.post.count({ where: { authorId: user.id } }),
    prisma.post.findMany({
      where: { authorId: user.id },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        createdAt: true,
        publishedAt: true,
        views: true,
        published: true,
        type: true,
        _count: { select: { likes: true, comments: true } },
      },
    }),
  ]);

  const postItems = posts.map((post) => {
    const likes = post._count.likes;
    const comments = post._count.comments;
    const heat = Math.round(post.views * 1 + likes * 3 + comments * 2);
    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      createdAt: post.createdAt,
      publishedAt: post.publishedAt,
      views: post.views,
      published: post.published,
      type: post.type,
      likes,
      comments,
      heat,
    };
  });

  return safeJson({
    profile: user,
    stats: { postCount, commentCount, receivedLikes },
    badges: user.userBadges.map((item) => item.badge),
    history: {
      tab: "posts",
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      items: postItems,
    },
  });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return errorJson("未授权", 401);
  if (!isSameOrigin(request)) return errorJson("非法来源请求", 403);

  const rate = await checkRateLimit(request, { namespace: "api-profile-update", limit: 30, windowMs: 60_000 });
  if (!rate.allowed) return errorJson("请求过于频繁，请稍后再试", 429);

  try {
    const data: unknown = await request.json();
    if (!data || typeof data !== "object" || Array.isArray(data)) return errorJson("请求体格式错误", 400);
    const payload = data as Record<string, unknown>;
    const name = normalizeString(payload.name, 80);
    const email = normalizeString(payload.email, 160).toLowerCase();
    const bio = normalizeString(payload.bio, 500);
    const title = normalizeString(payload.title, 120);
    const about = normalizeString(payload.about, 2_000);
    const company = normalizeString(payload.company, 160);
    const location = normalizeString(payload.location, 160);
    const blog = normalizeString(payload.blog, 500);
    const website = normalizeString(payload.website, 500);
    const twitter = normalizeString(payload.twitter, 120);
    const linkedin = normalizeString(payload.linkedin, 200);
    const hasActiveBadgeField = Object.prototype.hasOwnProperty.call(payload, "activeBadgeId");
    const activeBadgeIdRaw = payload.activeBadgeId;
    const activeBadgeId = typeof activeBadgeIdRaw === "string" ? normalizeString(activeBadgeIdRaw, 64) : "";

    if (hasActiveBadgeField && activeBadgeId) {
      const owned = await prisma.userBadge.findFirst({
        where: { userId: session.user.id, badgeId: activeBadgeId },
        select: { id: true },
      });
      if (!owned) return errorJson("只能佩戴已解锁徽章", 400);
    }

    const updateData: {
      name: string | null;
      email: string | null;
      bio: string;
      title: string | null;
      about: string;
      company: string | null;
      location: string | null;
      blog: string | null;
      website: string | null;
      twitter: string | null;
      linkedin: string | null;
      activeBadgeId?: string | null;
    } = {
      name: name || null,
      email: email || null,
      bio,
      title: title || null,
      about,
      company: company || null,
      location: location || null,
      blog: blog || null,
      website: website || null,
      twitter: twitter || null,
      linkedin: linkedin || null,
    };
    if (hasActiveBadgeField) updateData.activeBadgeId = activeBadgeId || null;

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    });

    return safeJson({ success: true, user: updated });
  } catch {
    return errorJson("保存失败", 500);
  }
}
