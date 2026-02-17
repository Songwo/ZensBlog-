import { prisma } from "@/lib/db";
import { PostEditor } from "@/components/admin/PostEditor";

export default async function NewPostPage() {
  const [categories, tags] = await Promise.all([
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">新建文章</h1>
      <PostEditor categories={categories} allTags={tags} />
    </div>
  );
}
