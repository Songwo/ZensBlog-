"use client";

import { useEffect, useRef } from "react";

interface BurstParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  hue: number;
}

export function CyberBurstLayer({ effectsLevel }: { effectsLevel: "low" | "medium" | "ultra" }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const particles: BurstParticle[] = [];
    let frame = 0;
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

    const spawnBurst = (x: number, y: number, intensity: "soft" | "hard") => {
      if (effectsLevel === "low" && intensity === "soft") return;

      const baseCount =
        intensity === "hard"
          ? effectsLevel === "ultra"
            ? 54
            : 36
          : effectsLevel === "ultra"
            ? 24
            : 16;
      const count = effectsLevel === "low" ? Math.max(10, Math.floor(baseCount * 0.45)) : baseCount;
      for (let i = 0; i < count; i += 1) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.45;
        const speedMultiplier = effectsLevel === "ultra" ? 1.24 : effectsLevel === "low" ? 0.82 : 1;
        const speed = ((intensity === "hard" ? 1.9 : 1.2) + Math.random() * 2.1) * speedMultiplier;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          size: 1 + Math.random() * (intensity === "hard" ? 3.8 : 2.4),
          hue: 185 + Math.random() * 110,
        });
      }
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.98;
        p.vy *= 0.98;
        p.vy += 0.02;
        p.life -= 0.022;

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 100%, 72%, ${p.life})`;
        ctx.fill();
      }

      frame = window.requestAnimationFrame(render);
    };

    let lastHoverTarget: Element | null = null;
    const onOver = (event: MouseEvent) => {
      const target = (event.target as Element | null)?.closest(".shock-link");
      if (!target || target === lastHoverTarget) return;
      lastHoverTarget = target;
      spawnBurst(event.clientX, event.clientY, "soft");
    };

    const onClick = (event: MouseEvent) => {
      const target = (event.target as Element | null)?.closest(".shock-link");
      if (!target) return;
      spawnBurst(event.clientX, event.clientY, "hard");
    };

    const onLeave = () => {
      lastHoverTarget = null;
    };

    resize();
    render();

    window.addEventListener("resize", resize);
    document.addEventListener("mouseover", onOver, { passive: true });
    document.addEventListener("click", onClick, { passive: true });
    document.addEventListener("mouseout", onLeave, { passive: true });

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("click", onClick);
      document.removeEventListener("mouseout", onLeave);
    };
  }, [effectsLevel]);

  return <canvas ref={canvasRef} className="cyber-burst-layer" aria-hidden />;
}
