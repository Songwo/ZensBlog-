import type { Metadata } from "next";
import { getNowItems } from "@/lib/content-pages";

export const metadata: Metadata = {
  title: "Now",
  description: "最近在做什么、在学什么、在读什么",
};

function getStatusClass(status: string) {
  if (status === "已完成") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "进行中") return "bg-violet-50 text-violet-700 border-violet-200";
  return "bg-slate-100 text-slate-600 border-slate-200";
}

export default async function NowPage() {
  const items = await getNowItems();

  return (
    <div className="mx-auto w-full max-w-[960px] px-4 sm:px-8 py-12 fade-in-up">
      <h1 className="text-4xl font-bold text-[#111111] mb-4">Now</h1>
      <p className="text-[#64748b] mb-8">这是一页动态状态板，记录我当下关注的事情。</p>
      <p className="text-xs text-[#8b94a9] mb-6">可在后台 `Now 页面管理` 中实时更新这部分内容。</p>

      <div className="space-y-4">
        {items.map((item) => (
          <section key={item.id} className="rounded-xl border border-[#eceff5] bg-white/70 p-5">
            <p className={`inline-flex rounded-full border px-2 py-0.5 text-xs mb-2 ${getStatusClass(item.status)}`}>{item.status}</p>
            <h2 className="text-lg font-semibold text-[#141414] mb-2">{item.title}</h2>
            <p className="text-sm text-[#555d6f]">{item.content}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
