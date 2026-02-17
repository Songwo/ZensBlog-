import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getLabItems } from "@/lib/content-pages";
import { LabInteractiveDemos } from "@/components/blog/LabInteractiveDemos";
import { LabSuggestionBox } from "@/components/blog/LabSuggestionBox";

export const metadata: Metadata = {
  title: "LAB",
  description: "交互实验区：算法可视化、UI 动效与前端小实验",
};

function getStatusClass(status: string) {
  if (status === "已完成") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "进行中") return "bg-violet-50 text-violet-700 border-violet-200 lab-status-live";
  return "bg-slate-100 text-slate-600 border-slate-200";
}

export default async function LabPage() {
  const demos = await getLabItems();

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-8 lg:px-12 py-12 fade-in-up">
      <h1 className="text-4xl font-bold text-[#111111] mb-4">ZEN::LAB 实验区</h1>
      <p className="text-[#64748b] mb-8 max-w-2xl">这里存放我做过的交互实验、可视化小工具和前端动效原型。</p>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {demos.map((demo) => (
          <article key={demo.id} className="lab-card rounded-xl border border-[#eceff5] bg-white/70 p-5 backdrop-blur-md transition-all duration-300">
            <p className={`inline-flex rounded-full border px-2 py-0.5 text-xs mb-2 ${getStatusClass(demo.status)}`}>{demo.status}</p>
            <h2 className="text-lg font-semibold text-[#141414]">{demo.name}</h2>
            <p className="mt-2 text-sm text-[#64748b]">{demo.desc}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {demo.articleSlug && (
                <Link
                  href={`/blog/${demo.articleSlug}`}
                  className="inline-flex items-center rounded-md border border-[#e2e8f0] px-2.5 py-1 text-xs text-[#334155] hover:border-[#f2a3c4] hover:text-[#c73b78] transition-colors"
                >
                  阅读背后原理
                </Link>
              )}
              {demo.sourceUrl && (
                <a
                  href={demo.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-md border border-[#e2e8f0] px-2.5 py-1 text-xs text-[#334155] hover:border-[#f2a3c4] hover:text-[#c73b78] transition-colors"
                >
                  View Source
                </a>
              )}
            </div>
          </article>
        ))}
      </div>

      <Suspense fallback={<div className="mt-10 rounded-xl border border-[#eceff5] bg-white/60 p-6 text-sm text-[#64748b]">加载实验组件中...</div>}>
        <LabInteractiveDemos />
      </Suspense>

      <LabSuggestionBox />
    </div>
  );
}
