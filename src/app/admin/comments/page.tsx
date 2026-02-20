import { prisma } from "@/lib/db";
import { CommentQueue } from "@/components/admin/CommentQueue";

export default async function AdminCommentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const status = (params.status || "PENDING").toUpperCase();
  const q = (params.q || "").trim();
  const page = Math.max(1, Number(params.page || 1));
  const pageSize = 20;
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {};
  if (["PENDING", "APPROVED", "REJECTED", "SPAM"].includes(status)) {
    where.status = status;
  }
  if (q) {
    where.OR = [
      { content: { contains: q } },
      { author: { contains: q } },
      { post: { title: { contains: q } } },
    ];
  }

  const comments = await prisma.comment.findMany({
    where,
    include: {
      post: { select: { title: true, slug: true } },
      _count: { select: { likes: true, reports: { where: { status: "OPEN" } } } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    skip,
    take: pageSize,
  });

  const [pending, total] = await Promise.all([
    prisma.comment.count({ where: { status: "PENDING" } }),
    prisma.comment.count({ where }),
  ]);

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
      <CommentQueue
        comments={comments}
        status={status}
        q={q}
        page={page}
        totalPages={Math.max(1, Math.ceil(total / pageSize))}
      />
    </div>
  );
}
