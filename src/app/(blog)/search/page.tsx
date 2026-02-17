import { searchPosts } from "@/lib/search";
import { SearchBar } from "@/components/blog/SearchBar";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "搜索" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = params.q || "";
  const results = query ? await searchPosts(query) : [];

  return (
    <div className="cyber-page-shell">
      <h1 className="font-heading text-2xl sm:text-3xl font-bold mb-6 cyber-page-title">搜索</h1>
      <div className="max-w-md mb-8">
        <SearchBar defaultValue={query} />
      </div>
      {query && (
        <p className="text-cyan-200/70 mb-6">
          找到 {results.length} 篇关于 &ldquo;{query}&rdquo; 的文章
        </p>
      )}
      {!query && <p className="text-cyan-200/70">输入关键词后回车，即可搜索标题、摘要和正文内容。</p>}
      {query && results.length === 0 && (
        <p className="text-cyan-200/70">没有找到匹配结果，试试更短的关键词或同义词。</p>
      )}
      {results.length > 0 && (
        <div className="space-y-6">
          {results.map((post) => (
            <article key={post.id} className="post-search-cyber">
              <Link href={`/blog/${post.slug}`} className="group block shock-link">
                <div className="flex items-center gap-3 text-xs text-cyan-200/70 mb-1">
                  {'category' in post && post.category && <span className="text-cyan-100">{post.category.name}</span>}
                  <time>{formatDate(post.publishedAt)}</time>
                </div>
                <h2 className="text-lg font-medium text-white group-hover:text-cyan-100 transition-colors">{post.title}</h2>
                <p className="text-sm text-cyan-100/75 mt-1 line-clamp-2">{post.excerpt}</p>
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
