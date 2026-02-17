import { prisma } from "@/lib/db";
import { NewsletterTable } from "@/components/admin/NewsletterTable";

export default async function AdminNewsletterPage() {
  const rows = await prisma.siteConfig.findMany({
    where: { key: { startsWith: "newsletter:" } },
    orderBy: { key: "asc" },
  });

  const subscribers = rows
    .map((row) => {
      try {
        return JSON.parse(row.value) as { email: string; createdAt: string; source: string };
      } catch {
        return null;
      }
    })
    .filter(Boolean) as { email: string; createdAt: string; source: string }[];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Newsletter 订阅管理</h1>
      <NewsletterTable subscribers={subscribers} />
    </div>
  );
}

