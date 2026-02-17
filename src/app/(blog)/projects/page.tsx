import { prisma } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "项目",
  description: "个人项目与开源作品展示",
};

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    where: { published: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-8 lg:px-12 py-12 sm:py-16 fade-in-up">
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#111111] mb-4">
          项目展示
        </h1>
        <p className="text-base sm:text-lg text-[#64748b] max-w-2xl mx-auto">
          个人项目与开源作品，记录构建过程与技术实践
        </p>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-[#94a3b8] text-lg">暂无项目</p>
        </div>
      ) : (
        <div className="grid gap-8 grid-cols-1 lg:grid-cols-2">
          {projects.map((project) => {
            const tags = project.tags ? project.tags.split(",").filter(Boolean) : [];

            return (
              <article
                key={project.id}
                className="zen-glass-card group rounded-2xl border border-[#eceff5] bg-white/60 backdrop-blur-md overflow-hidden shadow-[0_8px_24px_rgba(17,24,39,0.06),inset_0_1px_0_rgba(255,255,255,0.8)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_16px_40px_rgba(240,93,154,0.15)] hover:border-[#f2a3c4] hover:bg-gradient-to-br hover:from-white/70 hover:to-[#fff8fb]/60"
              >
                {/* Cover Image */}
                {project.coverImage && (
                  <div className="relative h-48 w-full overflow-hidden bg-[#f1f5f9]">
                    <Image
                      src={project.coverImage}
                      alt={project.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                )}

                <div className="p-6">
                  {/* Featured Badge */}
                  {project.featured && (
                    <div className="mb-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-[#fff0f6] to-[#ffe8f0] border border-[#f2a3c4]/30">
                      <svg className="w-3 h-3 text-[#f05d9a]" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-xs text-[#f05d9a] font-medium">精选</span>
                    </div>
                  )}

                  {/* Title */}
                  <h2 className="text-xl font-bold text-[#111111] mb-2 group-hover:text-[#f05d9a] transition-colors">
                    {project.title}
                  </h2>

                  {/* Description */}
                  <p className="text-sm text-[#64748b] leading-relaxed mb-4 line-clamp-3">
                    {project.description}
                  </p>

                  {/* Tech Stack */}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/80 text-[#64748b] border border-[#e2e8f0]"
                        >
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Links */}
                  <div className="flex items-center gap-3">
                    {project.demoUrl && (
                      <a
                        href={project.demoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-[#f05d9a] to-[#f78bb8] text-white text-sm font-medium transition-all duration-300 hover:shadow-[0_4px_20px_rgba(240,93,154,0.4)] hover:scale-105"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Demo
                      </a>
                    )}
                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#e2e8f0] bg-white/70 text-[#334155] text-sm font-medium backdrop-blur-sm transition-all duration-300 hover:border-[#f2a3c4] hover:text-[#f05d9a] hover:bg-gradient-to-r hover:from-[#fff0f6] hover:to-[#ffe8f0]"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                        </svg>
                        GitHub
                      </a>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
