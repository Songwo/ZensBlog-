import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  BookOpenText,
  Code2,
  Github,
  GraduationCap,
  Mail,
  Network,
  Rocket,
  Server,
  Sparkles,
  Terminal,
  Timer,
  Twitter,
} from "lucide-react";
import { AvatarWithBadge } from "@/components/blog/AvatarWithBadge";

export const metadata: Metadata = { title: "关于" };

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
      <section className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:to-slate-950">
        <div className="grid gap-6 md:grid-cols-[128px_1fr] items-start">
          <AvatarWithBadge
            alt="Zen"
            fallbackText="Zen"
            sizeClassName="h-28 w-28"
            badgeIcon="🍃"
            badgeColor="#22c55e"
            badgeTitle="Newbie"
            badgeSizeClassName="h-7 w-7"
          />
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100">关于我</h1>
            <p className="mt-2 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              <Sparkles className="h-3.5 w-3.5" />
              大四软件工程学生 · 后端开发爱好者
            </p>
            <p className="mt-4 text-sm leading-7 text-slate-700 dark:text-slate-300">
              你好，我是 Zen。平时专注后端开发、网络和服务器相关实践，也喜欢用脚本做自动化。
              这个站点主要记录项目踩坑、技术笔记和成长日志，希望把复杂问题拆成可复用经验。
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["后端开发", "网络与服务器", "自动化脚本", "开源学习", "工程化实践"].map((tag) => (
                <span key={tag} className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AboutCard icon={<Server className="h-4 w-4" />} title="后端">
          Node.js / Prisma / API 设计，关注稳定性、可维护性与边界处理。
        </AboutCard>
        <AboutCard icon={<Network className="h-4 w-4" />} title="网络">
          喜欢协议、服务编排和可观测性，追求“可定位、可恢复”的系统行为。
        </AboutCard>
        <AboutCard icon={<Terminal className="h-4 w-4" />} title="自动化">
          用脚本减少重复劳动，把部署、检查和日常任务自动化。
        </AboutCard>
        <AboutCard icon={<Code2 className="h-4 w-4" />} title="技术栈">
          Next.js、TypeScript、Prisma、Tailwind CSS、SQLite / PostgreSQL。
        </AboutCard>
        <AboutCard icon={<BookOpenText className="h-4 w-4" />} title="写作">
          用文章整理知识体系，长期输出可复用的经验与工具清单。
        </AboutCard>
        <AboutCard icon={<Rocket className="h-4 w-4" />} title="目标">
          持续发布高质量内容，建设一个长期可迭代的个人技术站点。
        </AboutCard>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">成长时间线</h2>
          <div className="mt-4 space-y-4">
            <TimelineItem icon={<GraduationCap className="h-4 w-4" />} title="大四 · 软件工程">
              正在做毕业阶段的工程化项目与技术总结。
            </TimelineItem>
            <TimelineItem icon={<Code2 className="h-4 w-4" />} title="开源实践">
              通过真实项目打磨代码质量和协作能力。
            </TimelineItem>
            <TimelineItem icon={<Timer className="h-4 w-4" />} title="长期输出">
              记录踩坑、方案对比和性能优化过程。
            </TimelineItem>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">联系我</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            欢迎交流后端、架构、部署和学习路线，也欢迎提出文章选题建议。
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <ContactBtn href="https://github.com" icon={<Github className="h-4 w-4" />} label="GitHub" />
            <ContactBtn href="https://x.com" icon={<Twitter className="h-4 w-4" />} label="Twitter / X" />
            <ContactBtn href="mailto:hello@zensblog.dev" icon={<Mail className="h-4 w-4" />} label="Email" />
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-xl border border-slate-200 bg-gradient-to-r from-rose-50 via-white to-indigo-50 p-5 text-sm text-slate-700 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 dark:text-slate-300">
        <p>
          这个 About 页面会持续迭代。你也可以去{" "}
          <Link href="/settings/profile" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
            个人设置
          </Link>{" "}
          查看更多资料。
        </p>
      </section>
    </div>
  );
}

function AboutCard({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
        {icon}
        {title}
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{children}</p>
    </div>
  );
}

function TimelineItem({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{title}</p>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{children}</p>
      </div>
    </div>
  );
}

function ContactBtn({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  return (
    <a
      href={href}
      target={href.startsWith("mailto:") ? undefined : "_blank"}
      rel={href.startsWith("mailto:") ? undefined : "noreferrer"}
      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-indigo-500 dark:hover:text-indigo-400"
    >
      {icon}
      {label}
    </a>
    );
}
