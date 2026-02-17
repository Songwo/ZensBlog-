"use client";

import { useEffect } from "react";

export function CyberInteractions({ effectsLevel }: { effectsLevel: "low" | "medium" | "ultra" }) {
  useEffect(() => {
    const magneticStrength = effectsLevel === "low" ? 0.05 : effectsLevel === "ultra" ? 0.16 : 0.12;
    const magnets = Array.from(document.querySelectorAll<HTMLElement>(".magnetic"));
    const cleanups = magnets.map((el) => {
      const onMove = (event: MouseEvent) => {
        const rect = el.getBoundingClientRect();
        const offsetX = (event.clientX - rect.left - rect.width / 2) * magneticStrength;
        const offsetY = (event.clientY - rect.top - rect.height / 2) * magneticStrength;
        el.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
      };

      const onLeave = () => {
        el.style.transform = "translate(0px, 0px)";
      };

      el.addEventListener("mousemove", onMove);
      el.addEventListener("mouseleave", onLeave);

      return () => {
        el.removeEventListener("mousemove", onMove);
        el.removeEventListener("mouseleave", onLeave);
      };
    });

    const onScroll = () => {
      document.documentElement.style.setProperty("--cyber-scroll", `${window.scrollY}`);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const shockLinks = Array.from(document.querySelectorAll<HTMLElement>(".shock-link"));
    shockLinks.forEach((el) => {
      const range = effectsLevel === "low" ? 24 : effectsLevel === "ultra" ? 64 : 40;
      const angle = `${Math.round(Math.random() * range * 2 - range)}deg`;
      el.style.setProperty("--shock-angle", angle);
    });

    return () => {
      cleanups.forEach((cleanup) => cleanup());
      window.removeEventListener("scroll", onScroll);
    };
  }, [effectsLevel]);

  return null;
}
