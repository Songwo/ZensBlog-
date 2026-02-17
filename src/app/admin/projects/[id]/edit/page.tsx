import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { ProjectEditor } from "@/components/admin/ProjectEditor";

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await prisma.project.findUnique({ where: { id } });

  if (!project) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">编辑项目</h1>
      <ProjectEditor project={project} />
    </div>
  );
}
