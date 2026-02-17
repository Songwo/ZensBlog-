"use client";

import { useEffect, useState } from "react";

export function PostEnhancer() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const container = document.getElementById("post-content");
    if (!container) return;

    const blocks = Array.from(
      container.querySelectorAll<HTMLElement>("p, h2, h3, h4, li, pre, blockquote"),
    );

    blocks.forEach((block, index) => {
      block.classList.add("post-block-reveal");
      block.style.transitionDelay = `${Math.min(index * 18, 240)}ms`;
    });

    const blockObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("is-reading");
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" },
    );

    blocks.forEach((block) => blockObserver.observe(block));

    const onScroll = () => {
      const rect = container.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      if (total <= 0) {
        setProgress(100);
        return;
      }
      const value = Math.min(100, Math.max(0, ((-rect.top) / total) * 100));
      setProgress(value);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      blockObserver.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress / 100);

  return (
    <div className="reading-orb" aria-hidden>
      <svg viewBox="0 0 56 56" width="56" height="56">
        <circle cx="28" cy="28" r={radius} className="reading-orb-track" />
        <circle
          cx="28"
          cy="28"
          r={radius}
          className="reading-orb-progress"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="reading-orb-text">{Math.round(progress)}%</span>
    </div>
  );
}
