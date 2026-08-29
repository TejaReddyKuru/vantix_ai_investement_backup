"use client";

import { useQuery } from "@tanstack/react-query";
import { parseMarketSnapshot } from "@/lib/market-data";

export function useMarketSnapshot(enabled = true) {
  return useQuery({
    queryKey: ["coincrest", "market-snapshot", "v2"],
    enabled,
    queryFn: async ({ signal }) => {
      const response = await fetch("/api/markets", {
        signal,
        cache: "no-store",
      });
      if (!response.ok)
        throw new Error("Market data is temporarily unavailable");
      return parseMarketSnapshot(await response.json());
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
