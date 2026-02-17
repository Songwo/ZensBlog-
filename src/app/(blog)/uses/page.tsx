import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Uses",
  description: "我在使用的硬件、软件、编辑器与工作流",
};

const sections = [
  {
    title: "硬件",
    items: ["MacBook Pro / Windows 双机", "机械键盘（线性轴）", "27 寸 4K 显示器"],
  },
  {
    title: "开发工具",
    items: ["VS Code + GitHub Copilot", "iTerm / PowerShell", "Prisma + Next.js + TypeScript"],
  },
  {
    title: "编辑器配置",
    items: ["JetBrains Mono", "Prettier + ESLint", "GitLens / Error Lens / Tailwind IntelliSense"],
  },
];

export default function UsesPage() {
  return (
    <div className="mx-auto w-full max-w-[1080px] px-4 sm:px-8 py-12 fade-in-up">
      <h1 className="text-4xl font-bold text-[#111111] mb-4">What I&apos;m Using</h1>
      <p className="text-[#64748b] mb-8">这页会长期更新，记录我当前的工作环境与常用工具链。</p>

      <div className="space-y-6">
        {sections.map((section) => (
          <section key={section.title} className="rounded-xl border border-[#eceff5] bg-white/70 p-6">
            <h2 className="text-xl font-semibold text-[#141414] mb-3">{section.title}</h2>
            <ul className="space-y-2 text-sm text-[#555d6f]">
              {section.items.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
