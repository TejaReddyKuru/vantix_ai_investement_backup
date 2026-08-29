"use client";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { directorySuggestions, parseDirectory, parseCatalogSnapshot } from "@/lib/asset-directory";
export function useDebouncedText(value: string, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => { const timer = window.setTimeout(() => setDebounced(value.trim()), delay); return () => window.clearTimeout(timer); }, [value, delay]);
  return debounced;
}
export function useAssetDirectory(query: string, enabled = true) {
  const term = useDebouncedText(query);
  const remote = useQuery({ queryKey: ["asset-directory-v4", term], enabled: enabled && term.length >= 2, queryFn: async ({ signal }) => {
    const response = await fetch(`/api/asset-search?q=${encodeURIComponent(term)}`, { signal });
    if (!response.ok) throw new Error("Directory search is temporarily unavailable");
    return parseDirectory((await response.json()).assets);
  }, staleTime: 300000, retry: false, refetchOnWindowFocus: false });
  const local = directorySuggestions(query);
  const assets = query.trim() === term && remote.data ? remote.data : local;
  return { ...remote, assets, searching: query.trim() !== term || (term.length >= 2 && remote.isFetching), metadataOnly: !remote.data || query.trim() !== term };
}
export function useCatalog(params: URLSearchParams, enabled = true) {
  const key = params.toString();
  return useQuery({ queryKey: ["market-catalog-v4", key], enabled, queryFn: async ({ signal }) => {
    const response = await fetch(`/api/markets?${key}`, { signal, cache: "no-store" });
    const body = await response.json();
    if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : "Market feed unavailable");
    return parseCatalogSnapshot(body);
  }, staleTime: 60000, refetchInterval: 60000, retry: false, refetchOnWindowFocus: false });
}
