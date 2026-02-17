import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Changelog",
  description: "博客演进日志：功能更新、视觉改版与修复记录",
};

const logs = [
  { date: "2026-02", title: "后台扩展", detail: "新增项目管理与友链管理 CRUD，补齐运营能力。" },
  { date: "2026-02", title: "阅读体验升级", detail: "增加阅读进度条、面包屑优化、深色主题细节调整。" },
  { date: "2026-02", title: "交互增强", detail: "加入 deploy() 动效反馈与 Cmd/Ctrl+K Spotlight 搜索。" },
];

export default function ChangelogPage() {
  return (
    <div className="mx-auto w-full max-w-[980px] px-4 sm:px-8 py-12 fade-in-up">
      <h1 className="text-4xl font-bold text-[#111111] mb-4">Changelog</h1>
      <p className="text-[#64748b] mb-8">这里记录博客本身的迭代过程，既是维护日志，也是内容素材。</p>

      <div className="space-y-4">
        {logs.map((log) => (
          <article key={`${log.date}-${log.title}`} className="rounded-xl border border-[#eceff5] bg-white/70 p-5">
            <p className="text-xs text-[#c73b78]">{log.date}</p>
            <h2 className="mt-1 text-lg font-semibold text-[#141414]">{log.title}</h2>
            <p className="mt-2 text-sm text-[#555d6f]">{log.detail}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
