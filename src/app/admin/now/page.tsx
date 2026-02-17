import { getNowItems } from "@/lib/content-pages";
import { NowEditor } from "@/components/admin/NowEditor";

export default async function AdminNowPage() {
  const items = await getNowItems();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Now 页面管理</h1>
      <NowEditor initialItems={items} />
    </div>
  );
}

