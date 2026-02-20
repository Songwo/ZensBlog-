"use client";

import { useCallback, useEffect, useState } from "react";
import type { MeOverview } from "@/components/settings/types";

const CACHE_TTL = 30_000;
let memoryCache: { data: MeOverview | null; fetchedAt: number } = { data: null, fetchedAt: 0 };

export function useOverview() {
  const [data, setData] = useState<MeOverview | null>(memoryCache.data);
  const [loading, setLoading] = useState(!memoryCache.data);
  const [error, setError] = useState("");

  const fetchNow = useCallback(async (force = false) => {
    if (!force && memoryCache.data && Date.now() - memoryCache.fetchedAt < CACHE_TTL) {
      setData(memoryCache.data);
      setLoading(false);
      return memoryCache.data;
    }

    setLoading(true);
    setError("");
    const res = await fetch("/api/me/overview", { cache: "no-store" });
    const payload = (await res.json()) as MeOverview & { error?: string };
    if (!res.ok) {
      setError(payload.error || "加载失败");
      setLoading(false);
      return null;
    }

    memoryCache = { data: payload, fetchedAt: Date.now() };
    setData(payload);
    setLoading(false);
    return payload;
  }, []);

  useEffect(() => {
    void fetchNow(false);
  }, [fetchNow]);

  return {
    data,
    loading,
    error,
    refresh: () => fetchNow(true),
    setData,
  };
}
