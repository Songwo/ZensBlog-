"use client";

import { useEffect } from "react";

export function MarkdownEnhancer({
  containerId,
  onImageClick,
}: {
  containerId: string;
  onImageClick?: (src: string) => void;
}) {
  useEffect(() => {
    const root = document.getElementById(containerId);
    if (!root) return;

    const preBlocks = Array.from(root.querySelectorAll<HTMLElement>("pre"));
    preBlocks.forEach((pre) => {
      if (pre.dataset.enhanced) return;
      pre.dataset.enhanced = "1";

      const codeNode = pre.querySelector("code");
      const className = codeNode?.className || "";
      const language = className.match(/language-([a-z0-9]+)/i)?.[1]?.toUpperCase() || "CODE";

      const bar = document.createElement("div");
      bar.className = "post-code-chrome";

      const lang = document.createElement("span");
      lang.className = "post-code-lang";
      lang.textContent = language;

      const copy = document.createElement("button");
      copy.type = "button";
      copy.className = "post-code-copy";
      copy.textContent = "复制";
      copy.onclick = async () => {
        const textRows = Array.from(pre.querySelectorAll<HTMLElement>(".md-code-tx"));
        const text = textRows.length
          ? textRows.map((n) => n.textContent || "").join("\n")
          : pre.textContent || "";
        try {
          await navigator.clipboard.writeText(text);
          copy.textContent = "已复制";
        } catch {
          copy.textContent = "失败";
        } finally {
          window.setTimeout(() => {
            copy.textContent = "复制";
          }, 1200);
        }
      };

      bar.appendChild(lang);
      bar.appendChild(copy);
      pre.parentElement?.insertBefore(bar, pre);
    });

    const images = Array.from(root.querySelectorAll<HTMLImageElement>("img"));
    images.forEach((img) => {
      img.loading = "lazy";
      img.decoding = "async";
      img.classList.add("post-inline-image");
      img.style.cursor = "zoom-in";
      img.onclick = () => {
        if (onImageClick) onImageClick(img.src);
      };
    });
  }, [containerId, onImageClick]);

  return null;
}

