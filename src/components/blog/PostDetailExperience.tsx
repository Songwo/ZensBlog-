"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { CommentSection } from "@/components/blog/CommentSection";
import { GiscusComments, canUseGiscus } from "@/components/blog/GiscusComments";
import type { TOCItem } from "@/lib/markdown";
import { AuthorMini } from "@/components/blog/AuthorMini";
import { AuthorCard } from "@/components/blog/AuthorCard";
import { LinkCardEnhancer } from "@/components/blog/LinkCardEnhancer";

interface DetailTag {
  id: string;
  name: string;
  slug: string;
}

interface DetailCategory {
  name: string;
  slug: string;
}

interface DetailComment {
  id: string;
  content: string;
  author: string;
  createdAt: Date;
  userId: string | null;
  user?: {
    id: string;
    username: string | null;
    name: string | null;
    image: string | null;
    title: string | null;
    activeBadge: { id: string; name: string; icon: string; iconUrl: string | null; color: string } | null;
  } | null;
  replies?: DetailComment[];
}

interface DetailPostCard {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string | null;
}

interface DetailMeta {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string | null;
  publishedAt: string | null;
  views: number;
  readingTime: number;
  category: DetailCategory | null;
  tags: DetailTag[];
  comments: DetailComment[];
  likeCount: number;
  viewerLiked: boolean;
}

interface SiteEnhancements {
  rewardQrImage: string;
  rewardText: string;
  adTitle: string;
  adDescription: string;
  adImage: string;
  adLink: string;
}

export function PostDetailExperience({
  post,
  authorName,
  author,
  toc,
  relatedPosts,
  prevPost,
  nextPost,
  siteEnhancements,
  children,
}: {
  post: DetailMeta;
  authorName: string;
  author: {
    id: string;
    username: string | null;
    name: string;
    image: string | null;
    bio: string | null;
    title: string | null;
    activeBadge: { id: string; name: string; icon: string; iconUrl: string | null; color: string } | null;
  };
  toc: TOCItem[];
  relatedPosts: DetailPostCard[];
  prevPost: DetailPostCard | null;
  nextPost: DetailPostCard | null;
  siteEnhancements: SiteEnhancements;
  children: React.ReactNode;
}) {
  const [activeHeading, setActiveHeading] = useState("");
  const [showTop, setShowTop] = useState(false);
  const [tocOpen, setTocOpen] = useState(true);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [rewardOpen, setRewardOpen] = useState(false);
  const [liked, setLiked] = useState(post.viewerLiked);
  const [starred, setStarred] = useState(false);
  const [likedCount, setLikedCount] = useState(post.likeCount);
  const [starredCount, setStarredCount] = useState(Math.max(3, Math.floor(post.views * 0.07)));
  const [readingProgress, setReadingProgress] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);

  const commentCount = post.comments.length;
  const useGiscus = canUseGiscus();

  useEffect(() => {
    const content = document.getElementById("post-content");
    if (!content) return;

    const headings = Array.from(content.querySelectorAll<HTMLElement>("h2[id], h3[id], h4[id]"));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveHeading(entry.target.id);
        });
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0.1 },
    );
    headings.forEach((heading) => observer.observe(heading));

    const codeObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("is-code-ready");
        });
      },
      { rootMargin: "120px 0px", threshold: 0.01 },
    );

    const preBlocks = Array.from(content.querySelectorAll<HTMLElement>(".code-block pre"));
    preBlocks.forEach((pre) => {
      codeObserver.observe(pre);
      if (pre.dataset.enhanced) return;
      pre.dataset.enhanced = "1";

      const language =
        pre.querySelector("code")?.className.match(/language-([a-z0-9]+)/i)?.[1]?.toUpperCase() || "CODE";

      const chrome = document.createElement("div");
      chrome.className = "post-code-chrome";

      const langBadge = document.createElement("span");
      langBadge.className = "post-code-lang";
      langBadge.textContent = language;

      const copyButton = document.createElement("button");
      copyButton.type = "button";
      copyButton.className = "post-code-copy shock-link magnetic";
      copyButton.textContent = "复制";
      copyButton.addEventListener("click", async () => {
        const text = pre.textContent || "";
        try {
          await navigator.clipboard.writeText(text);
          copyButton.textContent = "已复制";
          window.setTimeout(() => {
            copyButton.textContent = "复制";
          }, 1200);
        } catch {
          copyButton.textContent = "失败";
          window.setTimeout(() => {
            copyButton.textContent = "复制";
          }, 1200);
        }
      });

      chrome.appendChild(langBadge);
      chrome.appendChild(copyButton);
      pre.parentElement?.insertBefore(chrome, pre);
    });

    const images = Array.from(content.querySelectorAll<HTMLImageElement>("img"));
    images.forEach((img) => {
      img.loading = "lazy";
      img.decoding = "async";
      img.classList.add("post-inline-image");
      img.addEventListener("click", () => setLightboxImage(img.src));
    });

    const onScroll = () => {
      setShowTop(window.scrollY > 460);
      const doc = document.documentElement;
      const scrollTop = doc.scrollTop || document.body.scrollTop;
      const max = doc.scrollHeight - doc.clientHeight;
      const value = max > 0 ? Math.min(100, Math.max(0, (scrollTop / max) * 100)) : 0;
      setReadingProgress(value);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      observer.disconnect();
      codeObserver.disconnect();
      window.removeEventListener("scroll", onScroll);
      images.forEach((img) => {
        img.onclick = null;
      });
    };
  }, []);

  const shareLink = useMemo(() => {
    if (typeof window === "undefined") return "";
    return window.location.href;
  }, []);

  return (
    <div className="post-detail-page">
      <div className="post-reading-progress" aria-hidden>
        <span className="post-reading-progress-bar" style={{ width: `${readingProgress}%` }} />
      </div>

      <nav
        aria-label="面包屑导航"
        className="post-breadcrumb mb-8 inline-flex max-w-full items-center gap-2 rounded-full bg-slate-100/50 px-4 py-1.5 text-sm text-[#111111] backdrop-blur-sm"
      >
        <Link href="/" className="transition-colors hover:text-[#f05d9a]">
          首页
        </Link>
        <span aria-hidden className="text-black/40">/</span>
        <Link href="/blog" className="transition-colors hover:text-[#f05d9a]">
          文章
        </Link>
        <span aria-hidden className="text-black/40">/</span>
        <span className="min-w-0 max-w-[45vw] truncate text-black/70" title={post.title} aria-current="page">
          {post.title}
        </span>
      </nav>

      <div className="post-detail-layout">
        <article className="post-main-column">
          <header className="post-hero-card post-reading-wrap">
            {post.coverImage && (
              <div className="post-cover-wrap">
                <Image src={post.coverImage} alt={post.title} fill className="object-cover" priority={false} />
              </div>
            )}

            <h1 className="post-detail-title">{post.title}</h1>
            {post.excerpt && <p className="post-detail-subtitle">{post.excerpt}</p>}

            <div className="post-meta-row">
              <AuthorMini
                name={author.name || authorName || "Zen"}
                username={author.username || null}
                image={author.image || null}
                title={author.title || null}
                badge={author.activeBadge || null}
                size="md"
                enablePreview
              />
              <div>
                <p className="post-author-name">{authorName || "Zen"}</p>
                <p className="post-author-meta">
                  {formatDate(post.publishedAt)} · 预计 {post.readingTime} 分钟 · {post.views} 阅读 · {commentCount} 评论
                </p>
              </div>
            </div>

            <div className="post-action-row">
              <button
                type="button"
                className={`post-action-btn magnetic ${liked ? "is-active" : ""}`}
                onClick={async () => {
                  if (likeLoading) return;
                  setLikeLoading(true);
                  try {
                    const res = await fetch(`/api/posts/${post.id}/like`, { method: "POST" });
                    if (res.status === 401) {
                      window.location.href = `/auth/signin?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
                      return;
                    }
                    const data = (await res.json()) as { liked?: boolean; count?: number; error?: string };
                    if (!res.ok) {
                      console.error("[Post Like Error]", data.error || "unknown error");
                      return;
                    }
                    setLiked(Boolean(data.liked));
                    setLikedCount(Number(data.count || 0));
                  } catch (err) {
                    console.error("[Post Like Request Error]", err);
                  } finally {
                    setLikeLoading(false);
                  }
                }}
                disabled={likeLoading}
              >
                ♥ 点赞 {likedCount}
              </button>
              <button
                type="button"
                className={`post-action-btn magnetic ${starred ? "is-active" : ""}`}
                onClick={() => {
                  setStarred((v) => !v);
                  setStarredCount((v) => v + (starred ? -1 : 1));
                }}
              >
                ★ 收藏 {starredCount}
              </button>
              <button
                type="button"
                className="post-action-btn magnetic"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(shareLink);
                  } catch {
                    // noop
                  }
                }}
              >
                复制链接
              </button>
              <button
                type="button"
                className="post-action-btn magnetic"
                onClick={() => {
                  const url = `https://x.com/intent/tweet?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(post.title)}`;
                  window.open(url, "_blank", "noopener,noreferrer");
                }}
              >
                分享到 X
              </button>
              <button
                type="button"
                className="post-action-btn magnetic"
                onClick={() => {
                  const url = `https://service.weibo.com/share/share.php?url=${encodeURIComponent(shareLink)}&title=${encodeURIComponent(post.title)}`;
                  window.open(url, "_blank", "noopener,noreferrer");
                }}
              >
                分享到微博
              </button>
              <button type="button" className="post-action-btn magnetic" onClick={() => setRewardOpen(true)}>
                赞赏
              </button>
              <button
                type="button"
                className="post-action-btn magnetic"
                onClick={async () => {
                  try {
                    await fetch("/api/reports", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        targetType: "POST",
                        targetId: post.id,
                        reason: "OTHER",
                        detail: "user:report_from_post_page",
                      }),
                    });
                  } catch {
                    // ignore
                  }
                }}
              >
                举报
              </button>
            </div>
          </header>

          <div id="post-content" className="prose prose-base sm:prose-lg cyber-prose post-content-prose post-reading-wrap">
            {children}
          </div>
          <LinkCardEnhancer containerId="post-content" />

          <section className="post-tag-cloud post-reading-wrap">
            {post.tags.map((tag) => (
              <Link key={tag.id} href={`/tag/${tag.slug}`} className="tag-pill shock-link magnetic">
                #{tag.name}
              </Link>
            ))}
          </section>

          <section className="post-prev-next post-reading-wrap">
            {prevPost ? (
              <Link href={`/blog/${prevPost.slug}`} className="post-nav-card shock-link">
                <span>上一篇</span>
                <strong>{prevPost.title}</strong>
              </Link>
            ) : <div />}
            {nextPost ? (
              <Link href={`/blog/${nextPost.slug}`} className="post-nav-card shock-link">
                <span>下一篇</span>
                <strong>{nextPost.title}</strong>
              </Link>
            ) : <div />}
          </section>

          <section className="post-comment-area post-reading-wrap">
            {useGiscus ? (
              <>
                <h3 className="font-heading text-xl font-bold mb-6 text-[#1b1b1b]">评论</h3>
                <GiscusComments term={post.slug} />
              </>
            ) : (
              <CommentSection postId={post.id} comments={post.comments} />
            )}
          </section>
        </article>

        <aside className="post-side-column">
          <div className="post-side-card post-side-author">
            <h3>作者</h3>
            <AuthorCard
              className="mt-2"
              name={author.name || authorName || "Zen"}
              username={author.username || null}
              image={author.image || null}
              title={author.title || "独立开发者 / 技术写作者"}
              bio={author.bio || null}
              badge={author.activeBadge || null}
              actions={
                author.username ? (
                  <Link href={`/u/${author.username}`} className="rounded-md border border-[#e2e8f0] px-2.5 py-1 text-xs text-[#334155] hover:bg-white/60">
                    查看主页
                  </Link>
                ) : null
              }
            />
          </div>

          <div className="post-side-card post-side-toc">
            <div className="post-side-head">
              <h3>目录</h3>
              <button
                type="button"
                className="post-toc-toggle"
                onClick={() => setTocOpen((v) => !v)}
                disabled={toc.length === 0}
                aria-expanded={tocOpen}
                aria-controls="post-toc-list"
              >
                {toc.length === 0 ? "无目录" : tocOpen ? "收起" : "展开"}
              </button>
            </div>
            <ul id="post-toc-list" className={`post-toc-list ${tocOpen ? "is-open" : ""}`}>
              {toc.map((item) => (
                <li key={item.id}>
                  <a href={`#${item.id}`} className={activeHeading === item.id ? "is-active" : ""}>
                    {item.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="post-side-card">
            <h3>相关推荐</h3>
            <div className="post-related-mini">
              {relatedPosts.slice(0, 6).map((item) => (
                <Link key={item.id} href={`/blog/${item.slug}`} className="post-related-mini-item shock-link">
                  <strong>{item.title}</strong>
                  <span className="line-clamp-3">{item.excerpt}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="post-side-card">
            <h3>热门标签</h3>
            <div className="flex flex-wrap gap-2 mt-2">
              {post.tags.map((tag) => (
                <Link key={tag.id} href={`/tag/${tag.slug}`} className="tag-pill">
                  #{tag.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="post-side-card">
            <h3>赞赏二维码</h3>
            <button type="button" className="post-action-btn w-full mt-2" onClick={() => setRewardOpen(true)}>
              打开赞赏弹窗
            </button>
          </div>

          <div className="post-side-card post-ad-placeholder">
            <h3>{siteEnhancements.adTitle || "广告位"}</h3>
            {siteEnhancements.adImage ? (
              <a
                href={siteEnhancements.adLink || "#"}
                target={siteEnhancements.adLink ? "_blank" : undefined}
                rel={siteEnhancements.adLink ? "noreferrer noopener" : undefined}
                className="mt-2 block overflow-hidden rounded-md border border-[#e2e8f0]"
              >
                <img src={siteEnhancements.adImage} alt={siteEnhancements.adTitle || "广告"} className="h-auto w-full object-cover" loading="lazy" />
              </a>
            ) : null}
            <p className="mt-2">{siteEnhancements.adDescription || "赞助位（300 x 250）"}</p>
          </div>
        </aside>
      </div>

      {showTop && (
        <button
          type="button"
          className="post-back-top magnetic"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          ↑
        </button>
      )}

      {rewardOpen && (
        <div className="post-modal-mask" onClick={() => setRewardOpen(false)}>
          <div className="post-modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>赞赏支持</h3>
            <p>{siteEnhancements.rewardText || "感谢你的支持，继续输出高质量内容。"}</p>
            {siteEnhancements.rewardQrImage ? (
              <img
                src={siteEnhancements.rewardQrImage}
                alt="赞赏二维码"
                className="mx-auto mt-3 h-56 w-56 rounded-lg border border-[#e2e8f0] object-cover"
                loading="lazy"
              />
            ) : (
              <div className="post-qrcode-placeholder">请在后台设置赞赏二维码</div>
            )}
            <button type="button" className="post-action-btn mt-3 w-full" onClick={() => setRewardOpen(false)}>
              关闭
            </button>
          </div>
        </div>
      )}

      {lightboxImage && (
        <div className="post-modal-mask" onClick={() => setLightboxImage(null)}>
          <div className="post-lightbox" onClick={(e) => e.stopPropagation()}>
            <img src={lightboxImage} alt="preview" />
            <button type="button" className="post-action-btn mt-3" onClick={() => setLightboxImage(null)}>
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
