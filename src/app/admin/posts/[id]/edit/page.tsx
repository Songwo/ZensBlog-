import { prisma } from "@/lib/db";
import { PostEditor } from "@/components/admin/PostEditor";
import { notFound } from "next/navigation";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [post, categories, tags] = await Promise.all([
    prisma.post.findUnique({
      where: { id },
      include: { tags: { include: { tag: true } } },
    }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!post) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">编辑文章</h1>
      <PostEditor post={post} categories={categories} allTags={tags} />
    </div>
  );
}
