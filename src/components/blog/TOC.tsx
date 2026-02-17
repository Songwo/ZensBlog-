"use client";

import { useEffect, useState } from "react";
import type { TOCItem } from "@/lib/markdown";

export function TOC({ items }: { items: TOCItem[] }) {
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        }
      },
      { rootMargin: "-80px 0px -80% 0px" },
    );

    for (const item of items) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <nav className="hidden xl:block sticky top-24 ml-8 w-56 shrink-0 toc-cyber">
      <h4 className="text-xs font-medium uppercase tracking-wider mb-3">目录</h4>
      <ul className="space-y-1.5 text-sm border-l border-[#e6e9f0]">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={`block py-0.5 transition-colors ${
                item.level === 3 ? "pl-6" : item.level === 4 ? "pl-9" : "pl-3"
              } ${
                activeId === item.id
                  ? "text-[#c73b78] border-l-2 border-[#f05d9a] -ml-px"
                  : "text-[#6b7280] hover:text-[#c73b78]"
              }`}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
