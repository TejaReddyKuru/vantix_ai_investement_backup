"use client";
import Link from "next/link";
import { ArrowUpRight, Newspaper, RefreshCw } from "lucide-react";
import { useState } from "react";
import { backendError, useNews } from "@/hooks/useWorkspaceData";
import { dateLabel } from "@/lib/workspace-data";
import { workstationHref } from "@/lib/workspace-navigation";
export default function NewsFeed({
  initialSymbol = "BTC",
}: {
  initialSymbol?: string;
}) {
  const [symbol, setSymbol] = useState(
    initialSymbol === "USDT" ? "BTC" : initialSymbol,
  );
  const query = useNews(symbol);
  return (
    <section className="cc-card cc-news-card" aria-labelledby="news-title">
      <div className="cc-card-heading">
        <div>
          <span className="cc-eyebrow">Know what moved</span>
          <h2 id="news-title">Market news</h2>
        </div>
        <button
          className="cc-icon-button"
          type="button"
          aria-label="Refresh market news"
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          <RefreshCw size={16} />
        </button>
      </div>
      <div className="cc-news-tabs" role="group" aria-label="News market">
        {["BTC", "ETH", "SOL", "BNB"].map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={symbol === item}
            onClick={() => setSymbol(item)}
          >
            {item}
          </button>
        ))}
        <span>Publisher · publication time</span>
      </div>
      {query.isPending ? (
        <div className="cc-section-message" aria-live="polite">
          Loading market stories…
        </div>
      ) : query.isError ? (
        <div className="cc-section-message" role="status">
          <Newspaper size={25} />
          <h3>News is temporarily unavailable</h3>
          <p>{backendError(query.error)}</p>
        </div>
      ) : !query.data?.length ? (
        <div className="cc-section-message">
          <Newspaper size={25} />
          <h3>No published stories returned</h3>
          <p>
            There are no usable article links for {symbol} in the latest
            response. Try another market.
          </p>
        </div>
      ) : (
        <div className="cc-news-list">
          {query.data.slice(0, 4).map((article, index) => (
            <article
              key={article.id}
              className={index === 0 ? "cc-news-lead" : ""}
            >
              <div className="cc-story-meta">
                <span>{article.source}</span>
                <time dateTime={article.published_at}>
                  {dateLabel(article.published_at)}
                </time>
              </div>
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="cc-story-title"
              >
                {article.title}
                <ArrowUpRight size={16} aria-hidden="true" />
              </a>
              {index === 0 && <p>{article.description}</p>}
              <Link
                href={workstationHref(symbol, { analyze: true })}
                className="cc-story-market"
              >
                Analyze {symbol} in workstation <ArrowUpRight size={12} />
              </Link>
            </article>
          ))}
        </div>
      )}
      <div className="cc-news-footer">
        Articles supplied by your news service. Open the publisher’s story to
        verify context.
      </div>
    </section>
  );
}
