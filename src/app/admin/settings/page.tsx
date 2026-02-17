import { prisma } from "@/lib/db";
import { SettingsForm } from "@/components/admin/SettingsForm";

export default async function AdminSettingsPage() {
  const configs = await prisma.siteConfig.findMany();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">站点设置</h1>
      <SettingsForm configs={configs} />
    </div>
  );
}
