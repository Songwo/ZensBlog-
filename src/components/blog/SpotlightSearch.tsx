"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

interface SearchResult {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
}

export function SpotlightSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isInput =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.getAttribute("contenteditable") === "true";

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
      }

      if (event.key === "Escape") {
        setOpen(false);
      }

      if (isInput && !(event.metaKey || event.ctrlKey)) {
        return;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    const term = query.trim();
    if (term.length < 1) {
      setResults([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}&limit=8`, { signal: controller.signal });
        const data = await res.json();
        setResults(Array.isArray(data?.results) ? data.results : []);
      } catch {
        if (!controller.signal.aborted) setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 140);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query, open]);

  const hint = useMemo(() => (typeof navigator !== "undefined" && navigator.userAgent.includes("Mac") ? "Cmd" : "Ctrl"), []);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="spotlight-trigger"
        aria-label="打开搜索"
      >
        <span>搜索</span>
        <kbd>{hint}+K</kbd>
      </button>
    );
  }

  return (
    <div className="spotlight-mask" onClick={() => setOpen(false)}>
      <div className="spotlight-panel" onClick={(event) => event.stopPropagation()}>
        <input
          autoFocus
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="spotlight-input"
          placeholder="搜索文章、技术词、标题..."
        />
        <div className="spotlight-list">
          {loading && <p className="spotlight-empty">搜索中...</p>}
          {!loading && results.length === 0 && query.trim().length > 0 && <p className="spotlight-empty">未找到相关内容</p>}
          {!loading && query.trim().length === 0 && <p className="spotlight-empty">输入关键词开始搜索</p>}
          {!loading &&
            results.map((item) => (
              <Link key={item.id} href={`/blog/${item.slug}`} className="spotlight-item" onClick={() => setOpen(false)}>
                <strong>{item.title}</strong>
                <span>{item.excerpt}</span>
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
}
