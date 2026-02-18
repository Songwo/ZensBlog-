import { prisma } from "@/lib/db";
import { TagManager } from "@/components/admin/TagManager";

export default async function AdminTagsPage() {
  const tags = await prisma.tag.findMany({
    include: { _count: { select: { posts: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">标签管理</h1>
      <TagManager tags={tags} />
    </div>
  );
}

