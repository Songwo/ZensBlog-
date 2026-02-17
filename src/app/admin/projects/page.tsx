import { prisma } from "@/lib/db";
import Link from "next/link";
import { ProjectActions } from "@/components/admin/ProjectActions";

export default async function AdminProjectsPage() {
  const projects = await prisma.project.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">项目管理</h1>
        <Link
          href="/admin/projects/new"
          className="px-4 py-2 bg-accent text-white text-sm rounded-lg hover:opacity-90 transition-opacity"
        >
          新建项目
        </Link>
      </div>
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-secondary">
              <th className="text-left px-4 py-3 font-medium">标题</th>
              <th className="text-left px-4 py-3 font-medium w-20">发布</th>
              <th className="text-left px-4 py-3 font-medium w-20">精选</th>
              <th className="text-left px-4 py-3 font-medium w-20">排序</th>
              <th className="text-right px-4 py-3 font-medium w-24">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {projects.map((project) => (
              <tr key={project.id} className="hover:bg-bg-secondary/50 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/admin/projects/${project.id}/edit`} className="hover:text-accent transition-colors">
                    {project.title}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${project.published ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {project.published ? "已发布" : "草稿"}
                  </span>
                </td>
                <td className="px-4 py-3 text-text-secondary">{project.featured ? "是" : "否"}</td>
                <td className="px-4 py-3 text-text-secondary">{project.sortOrder}</td>
                <td className="px-4 py-3 text-right">
                  <ProjectActions projectId={project.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {projects.length === 0 && (
          <p className="text-center text-text-secondary py-8">暂无项目</p>
        )}
      </div>
    </div>
  );
}
