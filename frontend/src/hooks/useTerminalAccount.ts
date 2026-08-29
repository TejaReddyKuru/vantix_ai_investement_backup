"use client";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/client";
import { usePrivateQuery } from "./useWorkspaceData";
import { collection, parseAsset, parseUnified, parseWatchlist } from "@/lib/terminal-account";
import { validPair, type Interval } from "@/lib/terminal-market";

export function useWatchlists(page = 1) {
  return usePrivateQuery("watchlists", `/api/v1/watchlists?page=${page}&page_size=25`, (data, userId) => {
    const result = collection(data);
    return { ...result, items: result.items.map(value => { const w = value as Record<string, unknown>; return parseWatchlist({ ...w, items: w.items ?? [] }, userId); }) };
  });
}
export function useWatchlist(id: string | undefined) {
  return usePrivateQuery("watchlist", `/api/v1/watchlists/${encodeURIComponent(id ?? "")}`, parseWatchlist, Boolean(id));
}
export function useAssetRecords(ids: string[]) {
  const { token, user } = useAuth();
  return useQueries({ queries: [...new Set(ids)].slice(0, 25).map(id => ({
    queryKey: ["workspace-v2", user?.id ?? "guest", "asset", id],
    enabled: Boolean(token && user),
    staleTime: 300000, gcTime: 0, retry: false,
    queryFn: async ({ signal }: { signal: AbortSignal }) => parseAsset((await apiClient.get(`/api/v1/assets/${encodeURIComponent(id)}`, { signal, timeout: 15000, headers: { Authorization: `Bearer ${token}` } })).data),
  })) });
}
export function useAssetSearch(q: string) {
  return usePrivateQuery("asset-search", `/api/v1/assets/search?q=${encodeURIComponent(q)}&page_size=25`, data => { const list = collection(data); return { ...list, items: list.items.map(parseAsset) }; }, q.trim().length > 0, 300000);
}
export function useUnifiedAnalysis(pair: string, interval: Interval, automatic: boolean, enabled = true) {
  return usePrivateQuery("six-agents", `/api/v1/intelligence/${encodeURIComponent(pair)}?interval=${interval}`, (data, userId) => parseUnified(data, pair, userId, interval), validPair(pair) && enabled, automatic ? 60000 : 0);
}
export function useServerAlerts() {
  return usePrivateQuery("server-alerts", "/api/v1/alerts/rules?page=1&page_size=25", (value, userId) => {
    const list = collection(value);
    return { ...list, items: list.items.map(item => { if (typeof item !== "object" || item === null || !("user_id" in item) || item.user_id !== userId) throw new Error("Alert ownership mismatch"); return item as Record<string, unknown>; }) };
  });
}
export function useWatchlistMutation() {
  const { token, user } = useAuth();
  const cache = useQueryClient();
  async function post(path: string, body: unknown) {
    if (!token || !user) throw new Error("Sign in required");
    const response = await apiClient.post(path, body, { timeout: 15000, headers: { Authorization: `Bearer ${token}` } });
    await cache.invalidateQueries({ queryKey: ["workspace-v2", user.id, "watchlists"] });
    await cache.invalidateQueries({ queryKey: ["workspace-v2", user.id, "watchlist"] });
    return response.data;
  }
  return { create: (name: string) => post("/api/v1/watchlists", { name }), add: (id: string, assetId: string) => post(`/api/v1/watchlists/${encodeURIComponent(id)}/items`, { asset_id: assetId }) };
}
