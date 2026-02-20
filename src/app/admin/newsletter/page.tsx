import { prisma } from "@/lib/db";
import { NewsletterTable } from "@/components/admin/NewsletterTable";

export default async function AdminNewsletterPage() {
  const [rows, settingRows] = await Promise.all([
    prisma.siteConfig.findMany({
      where: { key: { startsWith: "newsletter:" } },
      orderBy: { key: "asc" },
    }),
    prisma.siteConfig.findMany({
      where: {
        key: {
          in: ["notify:feishuWebhook", "notify:wecomWebhook", "notify:emailEnabled", "notify:emailTo"],
        },
      },
    }),
  ]);

  const subscribers = rows
    .map((row) => {
      try {
        return JSON.parse(row.value) as { email: string; createdAt: string; source: string };
      } catch {
        return null;
      }
    })
    .filter(Boolean) as { email: string; createdAt: string; source: string }[];

  const settingsMap = Object.fromEntries(settingRows.map((row) => [row.key, row.value]));

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Newsletter 订阅管理</h1>
      <NewsletterTable
        subscribers={subscribers}
        notifySettings={{
          feishuWebhook: settingsMap["notify:feishuWebhook"] || "",
          wecomWebhook: settingsMap["notify:wecomWebhook"] || "",
          emailEnabled: (settingsMap["notify:emailEnabled"] || "").toLowerCase() === "true",
          emailTo: settingsMap["notify:emailTo"] || "",
        }}
      />
    </div>
  );
}
