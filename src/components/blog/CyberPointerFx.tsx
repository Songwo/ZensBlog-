"use client";

import { useEffect, useRef } from "react";

type Dot = { x: number; y: number };

export function CyberPointerFx({ effectsLevel }: { effectsLevel: "low" | "medium" | "ultra" }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pointer = { x: -1000, y: -1000, active: false };
    const trailSize = effectsLevel === "low" ? 8 : effectsLevel === "ultra" ? 22 : 14;
    const trail: Dot[] = Array.from({ length: trailSize }, () => ({ x: pointer.x, y: pointer.y }));

    let rafId = 0;
    let width = 0;
    let height = 0;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * window.devicePixelRatio);
      canvas.height = Math.floor(height * window.devicePixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    };

    const frame = () => {
      ctx.clearRect(0, 0, width, height);

      trail[0].x += (pointer.x - trail[0].x) * 0.35;
      trail[0].y += (pointer.y - trail[0].y) * 0.35;
      for (let i = 1; i < trail.length; i += 1) {
        trail[i].x += (trail[i - 1].x - trail[i].x) * 0.28;
        trail[i].y += (trail[i - 1].y - trail[i].y) * 0.28;
      }

      if (pointer.active) {
        for (let i = trail.length - 1; i >= 0; i -= 1) {
          const t = trail[i];
          const alpha = 1 - i / trail.length;
          const radius = (effectsLevel === "low" ? 6 : effectsLevel === "ultra" ? 16 : 10) * alpha;
          ctx.beginPath();
          ctx.arc(t.x, t.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0,255,255,${alpha * 0.16})`;
          ctx.fill();
        }

        const grad = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, effectsLevel === "ultra" ? 140 : 110);
        grad.addColorStop(0, "rgba(255,0,170,0.28)");
        grad.addColorStop(0.4, "rgba(0,255,255,0.22)");
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, effectsLevel === "ultra" ? 150 : 120, 0, Math.PI * 2);
        ctx.fill();
      }

      rafId = window.requestAnimationFrame(frame);
    };

    const onMove = (event: MouseEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
    };

    const onLeave = () => {
      pointer.active = false;
    };

    resize();
    frame();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseleave", onLeave);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, [effectsLevel]);

  return <canvas ref={canvasRef} className="cyber-pointer-fx" aria-hidden />;
}
