import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { FriendEditor } from "@/components/admin/FriendEditor";

export default async function EditFriendPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const friend = await prisma.friendLink.findUnique({ where: { id } });

  if (!friend) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">编辑友链</h1>
      <FriendEditor friend={friend} />
    </div>
  );
}
