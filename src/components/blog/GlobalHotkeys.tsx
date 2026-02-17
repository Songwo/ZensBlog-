"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export function GlobalHotkeys() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isInput =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.getAttribute("contenteditable") === "true";
      if (isInput || event.metaKey || event.ctrlKey || event.altKey) return;

      const key = event.key.toLowerCase();
      if (key === "l" && pathname !== "/lab") {
        event.preventDefault();
        router.push("/lab");
      }
      if (key === "b" && pathname !== "/blog") {
        event.preventDefault();
        router.push("/blog");
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pathname, router]);

  return null;
}

