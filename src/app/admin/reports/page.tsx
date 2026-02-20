import { prisma } from "@/lib/db";
import { ReportQueue } from "@/components/admin/ReportQueue";

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const status = (params.status || "OPEN").toUpperCase();
  const page = Math.max(1, Number(params.page || 1));
  const pageSize = 20;
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {};
  if (["OPEN", "RESOLVED", "IGNORED"].includes(status)) where.status = status;

  const [items, total] = await Promise.all([
    prisma.report.findMany({
      where,
      include: {
        user: { select: { id: true, username: true, name: true } },
        post: { select: { id: true, slug: true, title: true } },
        comment: { select: { id: true, content: true, post: { select: { slug: true } } } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.report.count({ where }),
  ]);

  return (
    <ReportQueue
      items={items}
      status={status}
      page={page}
      totalPages={Math.max(1, Math.ceil(total / pageSize))}
    />
  );
}
