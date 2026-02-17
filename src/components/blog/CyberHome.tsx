"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DeployChip } from "@/components/blog/DeployChip";
import { BrandCoverPlaceholder } from "@/components/blog/BrandCoverPlaceholder";
import { NewsletterSignup } from "@/components/blog/NewsletterSignup";
import { calculateReadingTime, formatDate, formatReadingTime } from "@/lib/utils";

interface CyberPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string | null;
  publishedAt: string | null;
  views: number;
  likes: number;
  comments: number;
  category: { name: string; slug: string } | null;
  tags: { name: string; slug: string }[];
}

interface CyberCategory {
  id: string;
  name: string;
  slug: string;
  postCount: number;
}

interface FeaturedProject {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverImage: string;
  demoUrl: string;
  githubUrl: string;
  tags: string[];
}

interface FeaturedFriend {
  id: string;
  name: string;
  description: string;
  url: string;
  avatar: string;
}

interface CyberHomeProps {
  effectsLevel: "low" | "medium" | "ultra";
  siteName: string;
  siteDescription: string;
  pinnedPost: CyberPost | null;
  recentPosts: CyberPost[];
  categories: CyberCategory[];
  featuredProjects: FeaturedProject[];
  featuredFriends: FeaturedFriend[];
}

export function CyberHome({
  effectsLevel,
  siteName,
  siteDescription,
  pinnedPost,
  recentPosts,
  categories,
  featuredProjects,
  featuredFriends,
}: CyberHomeProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<CyberPost[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const posts = useMemo(() => {
    const merged = pinnedPost ? [pinnedPost, ...recentPosts] : recentPosts;
    return merged.filter((post, index, arr) => arr.findIndex((p) => p.id === post.id) === index).slice(0, 12);
  }, [pinnedPost, recentPosts]);

  const trendingTags = useMemo(() => {
    const seen = new Set<string>();
    return posts
      .flatMap((post) => post.tags)
      .filter((tag) => {
        if (seen.has(tag.slug)) return false;
        seen.add(tag.slug);
        return true;
      })
      .slice(0, 8);
  }, [posts]);

  const topCategories = useMemo(
    () => categories.filter((cat) => cat.postCount > 0).sort((a, b) => b.postCount - a.postCount).slice(0, 6),
    [categories]
  );

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        setIsSearching(true);
        const response = await fetch(`/api/search?q=${encodeURIComponent(term)}&limit=5`, {
          signal: controller.signal,
        });
        const data = await response.json();
        const results = Array.isArray(data?.results) ? data.results : [];
        setSuggestions(results);
      } catch {
        if (!controller.signal.aborted) {
          setSuggestions([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      }
    }, 180);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [query]);

  return (
    <div className="text-[#111111] font-sans relative" data-effects-level={effectsLevel}>
      {/* 动态粉色光点浮动背景 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="zen-floating-orb zen-orb-1"></div>
        <div className="zen-floating-orb zen-orb-2"></div>
        <div className="zen-floating-orb zen-orb-3"></div>
        <div className="zen-floating-orb zen-orb-4"></div>
      </div>

      <section className="relative mx-auto w-full max-w-[1280px] px-4 sm:px-8 lg:px-12 min-h-[58vh] flex items-center justify-center py-16 sm:py-20 fade-in-up" style={{ zIndex: 1 }}>
        <div className="w-full text-center">
          {/* ZEN::LAB 品牌标识 */}
          <div className="mb-8 inline-flex flex-col items-center">
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold tracking-tight text-[#111111] font-mono">
              {siteName}
            </h1>
            <p className="mt-3 text-sm sm:text-base text-[#64748b] tracking-wide">
              Build · Ship · Think · Repeat
            </p>
          </div>

          <p className="mt-6 mx-auto max-w-2xl text-base sm:text-lg leading-8 text-[#475569]">
            {siteDescription || "一个面向程序员与独立开发者的个人技术博客。记录构建过程、产品思考与实战经验。"}
          </p>

          <div className="mt-8 mx-auto max-w-2xl">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const term = query.trim();
                if (!term) return;
                router.push(`/search?q=${encodeURIComponent(term)}`);
              }}
              className="relative flex w-full gap-2 rounded-xl border border-[#eceff5] bg-white/60 p-2 backdrop-blur-xl shadow-[0_8px_32px_rgba(240,93,154,0.08)] hover:shadow-[0_12px_40px_rgba(240,93,154,0.15)] transition-all duration-300"
            >
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索文章 / 技术 / 关键词..."
                className="h-11 flex-1 rounded-lg border border-transparent px-3 text-sm text-[#111111] outline-none bg-transparent focus:border-[#f2a3c4] focus:bg-white/80"
              />
              <button
                type="submit"
                className="h-11 rounded-lg bg-gradient-to-r from-[#f05d9a] to-[#f78bb8] px-5 text-sm font-medium text-white transition-all duration-300 hover:shadow-[0_4px_20px_rgba(240,93,154,0.4)] hover:scale-105"
              >
                Search
              </button>
            </form>
            {(isSearching || suggestions.length > 0) && (
              <div className="mt-2 rounded-xl border border-[#eceff5] bg-white/80 p-2 shadow-[0_12px_30px_rgba(17,24,39,0.08)] backdrop-blur-xl">
                {isSearching && <p className="px-2 py-2 text-sm text-[#64748b]">正在搜索...</p>}
                {!isSearching &&
                  suggestions.map((item) => (
                    <Link
                      key={item.id}
                      href={`/blog/${item.slug}`}
                      className="block rounded-lg px-2 py-2 transition-colors hover:bg-gradient-to-r hover:from-[#fff0f6] hover:to-[#ffe8f0]"
                    >
                      <p className="line-clamp-1 text-sm font-medium text-[#0f172a]">{item.title}</p>
                      <p className="line-clamp-1 text-xs text-[#64748b]">{item.excerpt}</p>
                    </Link>
                  ))}
                {!isSearching && suggestions.length === 0 && query.trim().length >= 2 && (
                  <p className="px-2 py-2 text-sm text-[#64748b]">没有找到相关文章</p>
                )}
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Link
              href="/blog"
              className="zen-glass-btn inline-flex items-center rounded-xl border border-[#e2e8f0] bg-white/70 px-6 py-3 text-sm font-medium text-[#2563eb] backdrop-blur-md shadow-[0_4px_16px_rgba(17,24,39,0.06)] transition-all duration-300 hover:shadow-[0_8px_24px_rgba(240,93,154,0.15)] hover:-translate-y-1 hover:bg-gradient-to-r hover:from-[#fff0f6] hover:to-[#ffe8f0] hover:border-[#f2a3c4]"
            >
              Explore Articles
            </Link>
            <Link
              href="/about"
              className="zen-glass-btn inline-flex items-center rounded-xl border border-[#e2e8f0] bg-white/70 px-6 py-3 text-sm font-medium text-[#334155] backdrop-blur-md shadow-[0_4px_16px_rgba(17,24,39,0.06)] transition-all duration-300 hover:shadow-[0_8px_24px_rgba(240,93,154,0.15)] hover:-translate-y-1 hover:bg-gradient-to-r hover:from-[#fff0f6] hover:to-[#ffe8f0] hover:border-[#f2a3c4]"
            >
              About Builder
            </Link>
          </div>

          <div className="mt-7 flex flex-wrap gap-2 justify-center">
            {trendingTags.map((tag) => (
              <Link
                key={tag.slug}
                href={`/tag/${tag.slug}`}
                className="rounded-full border border-[#e5e7ef] bg-white/60 backdrop-blur-sm px-3 py-1 text-xs text-[#475569] transition-all duration-300 hover:border-[#f2a3c4] hover:text-[#c73b78] hover:bg-gradient-to-r hover:from-[#fff0f6] hover:to-[#ffe8f0] hover:shadow-[0_4px_12px_rgba(240,93,154,0.2)]"
              >
                #{tag.name}
              </Link>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-2 justify-center">
            {topCategories.map((category) => (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className="rounded-lg border border-[#e5e7ef] bg-white/60 backdrop-blur-sm px-3 py-1.5 text-xs text-[#334155] transition-all duration-300 hover:border-[#f2a3c4] hover:text-[#c73b78] hover:bg-gradient-to-r hover:from-[#fff0f6] hover:to-[#ffe8f0] hover:shadow-[0_4px_12px_rgba(240,93,154,0.2)]"
              >
                {category.name} · {category.postCount}
              </Link>
            ))}
          </div>

          <div className="mx-auto max-w-2xl">
            <NewsletterSignup />
          </div>
        </div>
      </section>

      <section className="relative mx-auto w-full max-w-[1280px] px-4 sm:px-8 lg:px-12 py-8 sm:py-10 fade-in-up" style={{ zIndex: 1 }}>
        <div className="mb-7 flex items-end justify-between">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#111111]">Recent Drops</h2>
          <Link href="/blog" className="text-sm text-[#64748b] hover:text-[#c73b78] hover:underline underline-offset-4 transition-colors">
            进入完整文章库
          </Link>
        </div>

        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 justify-items-center">
          {posts.map((post) => (
            <article
              key={post.id}
              className="zen-glass-card w-full max-w-[380px] rounded-xl border border-[#eceff5] bg-white/60 backdrop-blur-md p-4 shadow-[0_8px_24px_rgba(17,24,39,0.06),inset_0_1px_0_rgba(255,255,255,0.8)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_16px_40px_rgba(240,93,154,0.15)] hover:border-[#f2a3c4] hover:bg-gradient-to-br hover:from-white/70 hover:to-[#fff8fb]/60"
            >
              <Link href={`/blog/${post.slug}`} className="block">
                <div className="relative mb-4 h-[200px] w-full overflow-hidden rounded-lg bg-[#f1f5f9]">
                  {post.coverImage ? (
                    <Image src={post.coverImage} alt={post.title} fill className="object-cover transition-transform duration-500 hover:scale-110" sizes="(max-width: 768px) 100vw, 380px" />
                  ) : (
                    <BrandCoverPlaceholder seed={post.slug} compact />
                  )}
                </div>

                <h3 className="line-clamp-3 text-lg font-semibold leading-7 text-[#111111]">{post.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#475569]">{post.excerpt}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-[#64748b]">
                  <span>{formatDate(post.publishedAt)}</span>
                  <span>预计 {formatReadingTime(calculateReadingTime(post.excerpt))}</span>
                </div>
                <div className="mt-2 flex items-center gap-3 text-xs text-[#475569]">
                  <span>👁 {post.views}</span>
                  <span>👍 {post.likes}</span>
                  <span>💬 {post.comments}</span>
                  <span className="rounded-full bg-rose-50 px-2 py-0.5 text-rose-600">
                    热度 {Math.round(post.views * 1 + post.likes * 3 + post.comments * 2)}
                  </span>
                </div>
              </Link>
              <DeployChip slug={post.slug} />
            </article>
          ))}
        </div>
      </section>

      {/* Featured Projects Section */}
      {featuredProjects.length > 0 && (
        <section className="relative mx-auto w-full max-w-[1280px] px-4 sm:px-8 lg:px-12 py-8 sm:py-10 fade-in-up" style={{ zIndex: 1 }}>
          <div className="mb-7 flex items-end justify-between">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#111111]">Featured Projects</h2>
            <Link href="/projects" className="text-sm text-[#64748b] hover:text-[#c73b78] hover:underline underline-offset-4 transition-colors">
              查看全部项目
            </Link>
          </div>

          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {featuredProjects.map((project) => (
              <article
                key={project.id}
                className="zen-glass-card group rounded-xl border border-[#eceff5] bg-white/60 backdrop-blur-md overflow-hidden shadow-[0_8px_24px_rgba(17,24,39,0.06),inset_0_1px_0_rgba(255,255,255,0.8)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_16px_40px_rgba(240,93,154,0.15)] hover:border-[#f2a3c4] hover:bg-gradient-to-br hover:from-white/70 hover:to-[#fff8fb]/60"
              >
                {project.coverImage && (
                  <div className="relative h-40 w-full overflow-hidden bg-[#f1f5f9]">
                    <Image
                      src={project.coverImage}
                      alt={project.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                )}

                <div className="p-5">
                  <h3 className="text-lg font-bold text-[#111111] mb-2 group-hover:text-[#f05d9a] transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-sm text-[#64748b] leading-relaxed mb-3 line-clamp-2">
                    {project.description}
                  </p>

                  {project.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {project.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-white/80 text-[#64748b] border border-[#e2e8f0]"
                        >
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    {project.demoUrl && (
                      <a
                        href={project.demoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#f05d9a] to-[#f78bb8] text-white text-xs font-medium transition-all duration-300 hover:shadow-[0_4px_20px_rgba(240,93,154,0.4)] hover:scale-105"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#e2e8f0] bg-white/70 text-[#334155] text-xs font-medium backdrop-blur-sm transition-all duration-300 hover:border-[#f2a3c4] hover:text-[#f05d9a]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                        </svg>
                        GitHub
                      </a>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Featured Friends Section */}
      {featuredFriends.length > 0 && (
        <section className="relative mx-auto w-full max-w-[1280px] px-4 sm:px-8 lg:px-12 py-8 sm:py-10 fade-in-up" style={{ zIndex: 1 }}>
          <div className="mb-7 flex items-end justify-between">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#111111]">精选友链</h2>
            <Link href="/friends" className="text-sm text-[#64748b] hover:text-[#c73b78] hover:underline underline-offset-4 transition-colors">
              查看全部友链
            </Link>
          </div>

          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {featuredFriends.map((friend) => (
              <a
                key={friend.id}
                href={friend.url}
                target="_blank"
                rel="noopener noreferrer"
                className="zen-glass-card group block rounded-xl border border-[#eceff5] bg-white/60 backdrop-blur-md p-4 shadow-[0_8px_24px_rgba(17,24,39,0.06),inset_0_1px_0_rgba(255,255,255,0.8)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_16px_40px_rgba(240,93,154,0.15)] hover:border-[#f2a3c4] hover:bg-gradient-to-br hover:from-white/70 hover:to-[#fff8fb]/60"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-[#f1f5f9] border border-[#e2e8f0] mb-2">
                    {friend.avatar ? (
                      <Image
                        src={friend.avatar}
                        alt={friend.name}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#94a3b8] text-lg font-bold">
                        {friend.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-[#111111] truncate w-full group-hover:text-[#f05d9a] transition-colors">
                    {friend.name}
                  </h3>
                  <p className="text-xs text-[#64748b] line-clamp-2 mt-1">
                    {friend.description || "暂无描述"}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
