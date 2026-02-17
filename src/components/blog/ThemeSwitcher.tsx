"use client";

import { useEffect, useState } from "react";

export function ThemeSwitcher() {
  const [ready, setReady] = useState(false);
  const [isNight, setIsNight] = useState(false);

  useEffect(() => {
    const saved = document.documentElement.getAttribute("data-theme") || "zenlab";
    setIsNight(saved === "night");
    setReady(true);
  }, []);

  function toggleTheme() {
    const next = isNight ? "zenlab" : "night";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    setIsNight(next === "night");
  }

  return (
    <div className="theme-switch-wrap">
      <button
        onClick={toggleTheme}
        disabled={!ready}
        className="theme-switch-btn"
        aria-label="切换主题"
        title={isNight ? "切换到亮色模式" : "切换到深色模式"}
      >
        {isNight ? "Light" : "Dark"}
      </button>
    </div>
  );
}
