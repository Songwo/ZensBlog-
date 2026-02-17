"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export function CyberBackdrop({ effectsLevel }: { effectsLevel: "low" | "medium" | "ultra" }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointerRef = useRef({ x: -9999, y: -9999, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const particles: Particle[] = [];
    let animationFrame = 0;
    let width = 0;
    let height = 0;
    const maxParticles = effectsLevel === "low" ? 24 : effectsLevel === "ultra" ? 96 : 64;
    const lineDistance = effectsLevel === "low" ? 88 : effectsLevel === "ultra" ? 140 : 120;

    const resetCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * window.devicePixelRatio);
      canvas.height = Math.floor(height * window.devicePixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    };

    const initParticles = () => {
      particles.length = 0;
      for (let i = 0; i < maxParticles; i += 1) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.22,
          vy: (Math.random() - 0.5) * 0.22,
          radius: 0.6 + Math.random() * 1.8,
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        const dx = pointerRef.current.x - p.x;
        const dy = pointerRef.current.y - p.y;
        const distanceToPointer = Math.hypot(dx, dy);
        if (pointerRef.current.active && distanceToPointer < 140) {
          p.x -= dx * 0.005;
          p.y -= dy * 0.005;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(145, 240, 255, 0.62)";
        ctx.fill();
      }

      for (let i = 0; i < particles.length; i += 1) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j += 1) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distance = Math.hypot(dx, dy);

          if (distance < lineDistance) {
            const alpha = (1 - distance / lineDistance) * 0.18;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(109, 210, 255, ${alpha})`;
            ctx.stroke();
          }
        }
      }

      animationFrame = window.requestAnimationFrame(draw);
    };

    const onMove = (event: MouseEvent) => {
      pointerRef.current = { x: event.clientX, y: event.clientY, active: true };
    };

    const onLeave = () => {
      pointerRef.current.active = false;
    };

    resetCanvas();
    initParticles();
    draw();

    window.addEventListener("resize", resetCanvas);
    window.addEventListener("resize", initParticles);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resetCanvas);
      window.removeEventListener("resize", initParticles);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, [effectsLevel]);

  return <canvas ref={canvasRef} className="cyber-backdrop" aria-hidden />;
}
