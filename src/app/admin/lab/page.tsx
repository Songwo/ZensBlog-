import { getLabItems } from "@/lib/content-pages";
import { LabEditor } from "@/components/admin/LabEditor";

export default async function AdminLabPage() {
  const items = await getLabItems();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">LAB 页面管理</h1>
      <LabEditor initialItems={items} />
    </div>
  );
}

