"use client";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useMarketSnapshot } from "@/hooks/useMarketSnapshot";
import { money, percent } from "@/lib/market-data";
import { workstationHref } from "@/lib/workspace-navigation";
import { AssetIcon, FeedStatus } from "./WorkspaceUI";
export default function MarketPulse() {
  const market = useMarketSnapshot();
  return (
    <section className="cc-card cc-pulse-card">
      <div className="cc-card-heading">
        <div>
          <span className="cc-eyebrow">The wider picture</span>
          <h2>Market pulse</h2>
        </div>
        <Link
          href="/markets"
          className="cc-icon-button"
          aria-label="Open all markets"
        >
          <ArrowUpRight size={17} />
        </Link>
      </div>
      <div className="cc-pulse-labels">
        <span>Asset</span>
        <span>Price / 24h</span>
      </div>
      <div className="cc-pulse-list">
        {["BTC", "ETH", "SOL", "BNB", "XRP"].map((symbol) => {
          const coin = market.data?.coins.find(
            (item) => item.symbol === symbol,
          );
          return (
            <Link
              key={symbol}
              href={workstationHref(symbol, { analyze: true })}
              className="cc-pulse-row"
              aria-label={`Analyze ${symbol} in the workstation`}
            >
              <AssetIcon symbol={symbol} />
              <span>
                <strong>{symbol}</strong>
                <small>{coin?.name ?? "Loading market"}</small>
              </span>
              <span className="cc-pulse-price">
                <strong>{money(coin?.currentPrice)}</strong>
                <small
                  className={
                    coin && coin.priceChange < 0 ? "cc-negative" : "cc-positive"
                  }
                >
                  {percent(coin?.priceChange)}
                </small>
              </span>
            </Link>
          );
        })}
      </div>
      <FeedStatus
        timestamp={market.data?.updatedAt}
        error={market.isError}
        pending={market.isPending}
        refreshing={market.isFetching}
        onRefresh={() => void market.refetch()}
      />
      <Link href="/markets" className="cc-watch-more">
        Explore all markets <ArrowUpRight size={14} />
      </Link>
    </section>
  );
}
