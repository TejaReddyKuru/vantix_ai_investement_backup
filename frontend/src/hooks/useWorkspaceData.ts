"use client";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { apiClient } from "@/lib/client";
import { useAuth } from "@/context/AuthContext";
import { apiSymbol } from "@/lib/workspace-navigation";
import {
  parseBrokers,
  parseIntelligence,
  parseNews,
  parseNotifications,
  parsePaperAccount,
  parsePaperSummary,
} from "@/lib/workspace-data";

export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
export function backendError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401)
      return "Your session has expired. Sign in again to load your account.";
    if (error.response?.status === 403)
      return "This account is not allowed to access this information.";
    if (error.response?.status === 404)
      return "No data is available for this account or market yet.";
    if (error.response?.status === 429)
      return "Too many requests. Please wait before refreshing.";
    if (!error.response)
      return "The account server could not be reached. Please try again.";
  }
  return "We couldn’t load this information. Please try again.";
}
export function usePrivateQuery<T>(
  key: string,
  path: string,
  parser: (value: unknown, userId: string) => T,
  enabled = true,
  interval = 60000,
) {
  const { user, token } = useAuth();
  const hydrated = useHydrated();
  return useQuery({
    queryKey: ["workspace-v2", user?.id ?? "guest", key, path],
    enabled: hydrated && Boolean(user?.id && token) && enabled,
    queryFn: async ({ signal }) => {
      if (!user || !token) throw new Error("Sign in required.");
      const response = await apiClient.get(path, {
        signal,
        timeout: 15000,
        headers: { Authorization: `Bearer ${token}` },
      });
      return parser(response.data, user.id);
    },
    staleTime: 30000,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
    refetchInterval: enabled && interval > 0 ? interval : false,
  });
}
export function usePaperAccount() {
  return usePrivateQuery(
    "paper-account",
    "/api/v1/paper-trading/account",
    parsePaperAccount,
  );
}
export function usePaperSummary() {
  return usePrivateQuery(
    "paper-summary",
    "/api/v1/portfolio/summary",
    parsePaperSummary,
  );
}
export function useBrokerConnections() {
  return usePrivateQuery(
    "broker-status",
    "/api/v1/execution/brokers/status",
    parseBrokers,
  );
}
export function useNews(symbol: string) {
  const pair = apiSymbol(symbol);
  return usePrivateQuery(
    "news",
    `/api/v1/news/${pair ?? "unsupported"}?limit=6`,
    (value) => parseNews(value, pair ?? ""),
    Boolean(pair),
    300000,
  );
}
export function useNotifications(page = 1) {
  return usePrivateQuery(
    "notifications",
    `/api/v1/notifications?page=${page}&page_size=20`,
    parseNotifications,
  );
}
export function useIntelligence(symbol: string, enabled: boolean) {
  const pair = apiSymbol(symbol);
  return usePrivateQuery(
    "analysis",
    `/api/v1/market-intelligence/${pair ?? "unsupported"}?interval=1h`,
    (value) => parseIntelligence(value, pair ?? ""),
    Boolean(pair) && enabled,
    300000,
  );
}
