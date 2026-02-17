"use client";

import { useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

function bubbleSortStep(arr: number[]) {
  const next = [...arr];
  for (let i = 0; i < next.length - 1; i += 1) {
    if (next[i] > next[i + 1]) {
      [next[i], next[i + 1]] = [next[i + 1], next[i]];
      break;
    }
  }
  return next;
}

export function LabInteractiveDemos() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const demoRef = useRef<HTMLDivElement | null>(null);
  const [bars, setBars] = useState([44, 18, 72, 31, 58, 24, 80, 39]);
  const [hue, setHue] = useState(Number(searchParams.get("h")) || 332);
  const [sat, setSat] = useState(Number(searchParams.get("s")) || 78);

  function syncQuery(nextHue: number, nextSat: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("h", String(nextHue));
    params.set("s", String(nextSat));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const gradient = useMemo(
    () => `linear-gradient(120deg, hsl(${hue} ${sat}% 70%), hsl(${(hue + 46) % 360} ${Math.max(30, sat - 22)}% 76%))`,
    [hue, sat],
  );

  const presets = [
    { name: "樱雾", h: 332, s: 78 },
    { name: "暮蓝", h: 216, s: 64 },
    { name: "霓虹夜", h: 286, s: 84 },
    { name: "苔青", h: 158, s: 52 },
  ];

  return (
    <section className="mt-10 grid gap-6 lg:grid-cols-2">
      <article ref={demoRef} className="rounded-xl border border-[#eceff5] bg-white/70 p-5 backdrop-blur-md">
        <h2 className="text-xl font-semibold text-[#141414]">Demo 1: 排序可视化</h2>
        <p className="text-sm text-[#64748b] mt-1">点击“下一步”执行一次冒泡排序交换。</p>
        <div className="mt-4 flex items-end gap-2 h-40">
          {bars.map((value, index) => (
            <div
              key={`${index}-${value}`}
              style={{ height: `${value * 1.8}px` }}
              className="flex-1 rounded-t-md bg-gradient-to-t from-[#f05d9a] to-[#f7a8c9] transition-all duration-300"
            />
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={() => setBars((prev) => bubbleSortStep(prev))} className="px-3 py-1.5 text-sm rounded-md bg-accent text-white">
            下一步
          </button>
          <button
            onClick={() => setBars([...bars].sort(() => Math.random() - 0.5))}
            className="px-3 py-1.5 text-sm rounded-md border border-[#e2e8f0]"
          >
            打乱
          </button>
          <button
            onClick={async () => {
              if (!demoRef.current) return;
              if (document.fullscreenElement) {
                await document.exitFullscreen();
              } else {
                await demoRef.current.requestFullscreen();
              }
            }}
            className="px-3 py-1.5 text-sm rounded-md border border-[#e2e8f0]"
          >
            全屏预览
          </button>
        </div>
      </article>

      <article className="rounded-xl border border-[#eceff5] bg-white/70 p-5 backdrop-blur-md">
        <h2 className="text-xl font-semibold text-[#141414]">Demo 2: 主题渐变生成器</h2>
        <p className="text-sm text-[#64748b] mt-1">调节色相与饱和度，实时生成品牌背景。</p>
        <div className="mt-4 rounded-lg h-40 border border-[#e2e8f0]" style={{ background: gradient }} />
        <div className="mt-3 flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => {
                setHue(preset.h);
                setSat(preset.s);
                syncQuery(preset.h, preset.s);
              }}
              className="px-2.5 py-1 text-xs rounded-full border border-[#e2e8f0] hover:border-[#f2a3c4] hover:text-[#c73b78]"
            >
              {preset.name}
            </button>
          ))}
        </div>
        <div className="mt-4 space-y-3">
          <label className="block text-sm text-[#555d6f]">
            Hue: {hue}
            <input
              type="range"
              min={0}
              max={360}
              value={hue}
              onChange={(e) => {
                const nextHue = Number(e.target.value);
                setHue(nextHue);
                syncQuery(nextHue, sat);
              }}
              className="w-full"
            />
          </label>
          <label className="block text-sm text-[#555d6f]">
            Saturation: {sat}
            <input
              type="range"
              min={20}
              max={100}
              value={sat}
              onChange={(e) => {
                const nextSat = Number(e.target.value);
                setSat(nextSat);
                syncQuery(hue, nextSat);
              }}
              className="w-full"
            />
          </label>
        </div>
      </article>
    </section>
  );
}
