"use client";

import { useEffect, useState, type ReactNode } from "react";
import { FlaskConical, Radio, RefreshCw, WifiOff } from "lucide-react";
import { useTradingMode } from "@/context/TradingModeContext";
import { isSnapshotStale } from "@/lib/market-data";
import CoinIcon from "@/components/market/CoinIcon";

export function ModeSwitch() {
  const { mode, setMode } = useTradingMode();
  return (
    <div className="cc-segmented" role="group" aria-label="Account mode">
      <button
        type="button"
        aria-pressed={mode === "paper"}
        onClick={() => setMode("paper")}
      >
        <FlaskConical size={15} aria-hidden="true" />
        Paper
      </button>
      <button
        type="button"
        aria-pressed={mode === "live"}
        onClick={() => setMode("live")}
      >
        <Radio size={15} aria-hidden="true" />
        Live
      </button>
    </div>
  );
}
export function AssetIcon({
  symbol,
  size = 32,
}: {
  symbol: string;
  size?: number;
}) {
  return (
    <CoinIcon symbol={symbol} size={size} />
  );
}
export function EmptyState({
  icon,
  title,
  children,
  compact = false,
}: {
  icon?: ReactNode;
  title: string;
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={`cc-empty ${compact ? "cc-empty-compact" : ""}`}>
      {icon && (
        <div className="cc-empty-icon" aria-hidden="true">
          {icon}
        </div>
      )}
      <h3>{title}</h3>
      <div className="cc-muted">{children}</div>
    </div>
  );
}
export function FeedStatus({
  timestamp,
  error,
  pending,
  refreshing,
  onRefresh,
}: {
  timestamp?: string | null;
  error: boolean;
  pending: boolean;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  const stale = now === null || isSnapshotStale(timestamp, now);
  const time =
    timestamp && now !== null
      ? new Date(timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;
  return (
    <div className="cc-feed-status">
      <span
        className={`cc-status-dot ${error || stale ? "cc-status-muted" : ""}`}
        aria-hidden="true"
      />
      <span>
        {pending
          ? "Loading market snapshot"
          : error
            ? timestamp
              ? `Update failed · last received ${time || "earlier"}`
              : "Market feed unavailable"
            : `CoinGecko snapshot${time ? ` · received ${time}` : ""}${stale ? " · delayed" : ""}`}
      </span>
      <button
        type="button"
        className="cc-icon-button cc-small-button"
        onClick={onRefresh}
        disabled={refreshing}
        aria-label="Refresh market data"
      >
        <RefreshCw
          size={14}
          className={refreshing ? "cc-spin" : ""}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}
export function ConnectionNotice({ children }: { children: ReactNode }) {
  return (
    <div className="cc-connection-notice">
      <WifiOff size={16} aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}
