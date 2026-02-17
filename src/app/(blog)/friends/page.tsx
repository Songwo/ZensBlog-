import { prisma } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "友链",
  description: "友情链接 - 一起交流学习",
};

export default async function FriendsPage() {
  const friends = await prisma.friendLink.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-8 lg:px-12 py-12 sm:py-16 fade-in-up">
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#111111] mb-4">
          友情链接
        </h1>
        <p className="text-base sm:text-lg text-[#64748b] max-w-2xl mx-auto">
          一起交流学习，共同成长进步
        </p>
      </div>

      {friends.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-[#94a3b8] text-lg">暂无友链</p>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {friends.map((friend) => (
            <a
              key={friend.id}
              href={friend.url}
              target="_blank"
              rel="noopener noreferrer"
              className="zen-glass-card group block rounded-xl border border-[#eceff5] bg-white/60 backdrop-blur-md p-5 shadow-[0_8px_24px_rgba(17,24,39,0.06),inset_0_1px_0_rgba(255,255,255,0.8)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_16px_40px_rgba(240,93,154,0.15)] hover:border-[#f2a3c4] hover:bg-gradient-to-br hover:from-white/70 hover:to-[#fff8fb]/60"
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="flex-shrink-0 w-14 h-14 rounded-full overflow-hidden bg-[#f1f5f9] border border-[#e2e8f0]">
                  {friend.avatar ? (
                    <Image
                      src={friend.avatar}
                      alt={friend.name}
                      width={56}
                      height={56}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#94a3b8] text-xl font-bold">
                      {friend.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-[#111111] mb-1 truncate group-hover:text-[#f05d9a] transition-colors">
                    {friend.name}
                  </h3>
                  <p className="text-sm text-[#64748b] line-clamp-2 leading-relaxed">
                    {friend.description || "暂无描述"}
                  </p>
                </div>
              </div>

              {/* Featured Badge */}
              {friend.featured && (
                <div className="mt-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-[#fff0f6] to-[#ffe8f0] border border-[#f2a3c4]/30">
                  <svg className="w-3 h-3 text-[#f05d9a]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-xs text-[#f05d9a] font-medium">精选</span>
                </div>
              )}
            </a>
          ))}
        </div>
      )}

      {/* Apply Section */}
      <div className="mt-16 text-center">
        <div className="inline-block rounded-2xl border border-[#eceff5] bg-white/60 backdrop-blur-md p-8 shadow-[0_8px_24px_rgba(17,24,39,0.06)]">
          <h2 className="text-2xl font-semibold text-[#111111] mb-3">申请友链</h2>
          <p className="text-[#64748b] mb-6 max-w-md">
            欢迎交换友链，请确保网站内容积极向上，访问稳定
          </p>
          <div className="space-y-2 text-sm text-[#64748b] text-left max-w-md mx-auto">
            <p>• 站点名称：ZEN::LAB</p>
            <p>• 站点描述：Build · Ship · Think · Repeat</p>
            <p>• 站点地址：https://zensblog.dev</p>
          </div>
        </div>
      </div>
    </div>
  );
}
