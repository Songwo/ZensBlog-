import { prisma } from "@/lib/db";
import { CommentQueue } from "@/components/admin/CommentQueue";

export default async function AdminCommentsPage() {
  const comments = await prisma.comment.findMany({
    include: { post: { select: { title: true, slug: true } } },
    orderBy: [{ approved: "asc" }, { createdAt: "desc" }],
  });

  const pending = comments.filter((c) => !c.approved).length;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold">评论管理</h1>
        {pending > 0 && (
          <span className="text-xs px-2.5 py-1 bg-accent/10 text-accent rounded-full font-medium">
            {pending} 条待审核
          </span>
        )}
      </div>
      <CommentQueue comments={comments} />
    </div>
  );
}
