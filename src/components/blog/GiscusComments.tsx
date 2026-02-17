"use client";

import { useEffect, useRef } from "react";

interface GiscusCommentsProps {
  term: string;
}

const GISCUS_REPO = process.env.NEXT_PUBLIC_GISCUS_REPO;
const GISCUS_REPO_ID = process.env.NEXT_PUBLIC_GISCUS_REPO_ID;
const GISCUS_CATEGORY = process.env.NEXT_PUBLIC_GISCUS_CATEGORY;
const GISCUS_CATEGORY_ID = process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID;
const GISCUS_MAPPING = process.env.NEXT_PUBLIC_GISCUS_MAPPING || "specific";
const GISCUS_THEME = process.env.NEXT_PUBLIC_GISCUS_THEME || "preferred_color_scheme";

function hasGiscusConfig() {
  return Boolean(GISCUS_REPO && GISCUS_REPO_ID && GISCUS_CATEGORY && GISCUS_CATEGORY_ID);
}

export function canUseGiscus() {
  return hasGiscusConfig();
}

export function GiscusComments({ term }: GiscusCommentsProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hostRef.current || !hasGiscusConfig()) return;
    hostRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.setAttribute("data-repo", GISCUS_REPO!);
    script.setAttribute("data-repo-id", GISCUS_REPO_ID!);
    script.setAttribute("data-category", GISCUS_CATEGORY!);
    script.setAttribute("data-category-id", GISCUS_CATEGORY_ID!);
    script.setAttribute("data-mapping", GISCUS_MAPPING);
    script.setAttribute("data-term", term);
    script.setAttribute("data-strict", "0");
    script.setAttribute("data-reactions-enabled", "1");
    script.setAttribute("data-emit-metadata", "0");
    script.setAttribute("data-input-position", "top");
    script.setAttribute("data-theme", GISCUS_THEME);
    script.setAttribute("data-lang", "zh-CN");
    script.setAttribute("data-loading", "lazy");
    hostRef.current.appendChild(script);
  }, [term]);

  if (!hasGiscusConfig()) return null;

  return <div ref={hostRef} />;
}
