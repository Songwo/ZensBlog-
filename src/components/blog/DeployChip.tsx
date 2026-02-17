"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeployChip({ slug }: { slug: string }) {
  const router = useRouter();
  const [running, setRunning] = useState(false);

  return (
    <div className="deploy-chip-wrap mt-4">
      <button
        type="button"
        className={`code-glow deploy-chip ${running ? "is-running" : ""}`}
        onClick={() => {
          if (running) return;
          setRunning(true);
          window.setTimeout(() => {
            router.push(`/blog/${slug}`);
          }, 520);
        }}
      >
        <code>{`deploy("${slug}")`}</code>
      </button>
      <span className={`deploy-status ${running ? "is-visible" : ""}`}>[ok] launching article...</span>
    </div>
  );
}
