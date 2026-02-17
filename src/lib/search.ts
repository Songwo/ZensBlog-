import { prisma } from "./db";

export async function searchPosts(query: string, limit = 20) {
  if (!query.trim()) return [];

  const searchTerm = query.trim();

  try {
    const posts = await prisma.$queryRaw<
      Array<{
        id: string;
        title: string;
        slug: string;
        excerpt: string;
        publishedAt: Date | null;
        similarity: number;
      }>
    >`
      SELECT
        p.id,
        p.title,
        p.slug,
        p.excerpt,
        p."publishedAt",
        GREATEST(
          similarity(p.title, ${searchTerm}),
          similarity(p.excerpt, ${searchTerm}) * 0.8,
          similarity(p.content, ${searchTerm}) * 0.6
        ) as similarity
      FROM "Post" p
      WHERE p.published = true
        AND p.type = 'OFFICIAL'
        AND (
          p.title % ${searchTerm}
          OR p.excerpt % ${searchTerm}
          OR p.content % ${searchTerm}
        )
      ORDER BY similarity DESC, p."publishedAt" DESC
      LIMIT ${limit}
    `;

    const postsWithCategory = await Promise.all(
      posts.map(async (post) => {
        const fullPost = await prisma.post.findUnique({
          where: { id: post.id },
          select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            publishedAt: true,
            category: { select: { name: true, slug: true } },
          },
        });
        return fullPost;
      })
    );

    return postsWithCategory.filter((p): p is NonNullable<typeof p> => p !== null);
  } catch (error) {
    console.warn("PostgreSQL full-text search failed, falling back to basic search:", error);

    const posts = await prisma.post.findMany({
      where: {
        published: true,
        type: "OFFICIAL",
        OR: [
          { title: { contains: searchTerm } },
          { content: { contains: searchTerm } },
          { excerpt: { contains: searchTerm } },
        ],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        publishedAt: true,
        category: { select: { name: true, slug: true } },
      },
      orderBy: { publishedAt: "desc" },
      take: limit,
    });

    return posts;
  }
}
