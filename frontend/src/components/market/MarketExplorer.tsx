"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowDownUp, ArrowUpRight, ChevronLeft, ChevronRight, Layers3, Search, X } from "lucide-react";
import { MARKET_CATEGORIES, UTILITY_SECTORS, categoryFromQuery, terminalSymbolForId, validCoinId, type CatalogCoin, type CategoryKey } from "@/lib/asset-directory";
import { money, percent, isSnapshotStale } from "@/lib/market-data";
import { workstationHref } from "@/lib/workspace-navigation";
import { useCatalog, useDebouncedText } from "@/hooks/useAssetDirectory";
import { FeedStatus } from "@/components/dashboard/WorkspaceUI";
import CoinIcon from "./CoinIcon";

function Sparkline({ prices }: { prices: number[] }) {
  if (prices.length < 2) return <span className="cc-muted">—</span>;
  const low = Math.min(...prices), high = Math.max(...prices), range = high - low || 1;
  const points = prices.map((price, i) => `${i / (prices.length - 1) * 110},${29 - (price - low) / range * 26}`).join(" ");
  return <svg width="110" height="32" viewBox="0 0 110 32" role="img" aria-label="Provider price history, last 24 samples" className={prices.at(-1)! < prices[0] ? "cc-negative" : "cc-positive"}><polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.7" /></svg>;
}
export default function MarketExplorer() {
  const searchParams = useSearchParams(), searchKey = searchParams.toString();
  const [query, setQuery] = useState("");
  const term = useDebouncedText(query);
  const [category, setCategory] = useState<CategoryKey>("all"), [sector, setSector] = useState("oracle"), [page, setPage] = useState(1);
  const [idFilter, setIdFilter] = useState("");
  const [sort, setSort] = useState<"marketCap" | "volume" | "priceChange" | "currentPrice">("marketCap");
  const [ascending, setAscending] = useState(false), [selected, setSelected] = useState<CatalogCoin | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(searchKey), search = params.get("search") ?? "";
    const match = categoryFromQuery(search);
    const categoryValue = params.get("category");
    setQuery(match ? "" : search); setPage(1); setSelected(null);
    setCategory(match ?? MARKET_CATEGORIES.find(c => c.key === categoryValue)?.key ?? "all");
    const coin = params.get("coin") ?? ""; setIdFilter(validCoinId(coin) ? coin : "");
  }, [searchKey]);
  useEffect(() => { setPage(1); }, [term]);
  const interpreted = categoryFromQuery(term);
  const params = new URLSearchParams({ page: String(page), category: interpreted ?? category });
  if (idFilter) params.set("ids", idFilter);
  else if (term && !interpreted) { params.set("search", term); params.set("category", "all"); }
  if (category === "utility" || interpreted === "utility") params.set("sector", sector);
  const market = useCatalog(params, query.trim() === term);
  const coins = useMemo(() => [...(market.data?.coins ?? [])].sort((a, b) => {
    if (a[sort] === null) return 1; if (b[sort] === null) return -1;
    return ((a[sort] as number) - (b[sort] as number)) * (ascending ? 1 : -1);
  }), [market.data, sort, ascending]);
  const filter = MARKET_CATEGORIES.find(c => c.key === (interpreted ?? category))!;
  function selectCategory(key: CategoryKey) { setCategory(key); setQuery(""); setPage(1); setIdFilter(""); setSelected(null); }
  const rows = market.data?.coins ?? [];
  const positive = rows.filter(c => c.priceChange !== null && c.priceChange > 0).length;
  const negative = rows.filter(c => c.priceChange !== null && c.priceChange < 0).length;
  return <div className="cc-page cc-market-explorer">
    <div className="cc-page-heading"><div><span className="cc-eyebrow">Explore · compare · understand</span><h1>Markets<span className="cc-title-dot">.</span></h1><p>A broader view of crypto. Bring the evidence into your next decision.</p></div><span className="cc-source-pill"><Layers3 size={15}/>CoinGecko · USD reference data</span></div>
    <div className="cc-market-summary"><div><span className="cc-eyebrow">In this page</span><strong>{rows.length || "—"}<small>assets</small></strong></div><div><span className="cc-eyebrow">Positive 24h</span><strong className="cc-positive">{rows.length ? positive : "—"}<small>advancing</small></strong></div><div><span className="cc-eyebrow">Negative 24h</span><strong className="cc-negative">{rows.length ? negative : "—"}<small>declining</small></strong></div><p>Search by name or ticker across the provider’s directory. Token IDs distinguish assets sharing the same symbol.</p></div>
    <section className="cc-card cc-catalog-card" aria-label="Crypto market directory">
      <div className="cc-catalog-search"><Search size={19}/><label className="cc-sr-only" htmlFor="catalog-search">Search all cryptocurrencies</label><input id="catalog-search" value={query} maxLength={100} onChange={e => { setQuery(e.target.value); setIdFilter(""); setPage(1); setCategory("all"); }} placeholder="Search Bitcoin, USD Coin, Monero, or a category…" autoComplete="off"/>{(query || idFilter) && <button type="button" className="cc-icon-button" onClick={() => { setQuery(""); setIdFilter(""); setPage(1); }} aria-label="Clear asset filter"><X size={17}/></button>}<span>ALL CRYPTO</span></div>
      <div className="cc-category-tabs" role="group" aria-label="Crypto categories">{MARKET_CATEGORIES.map(item => <button type="button" key={item.key} aria-pressed={filter.key === item.key && !idFilter} onClick={() => selectCategory(item.key)}>{item.label}</button>)}</div>
      <div className="cc-category-description"><p>{idFilter ? `Asset ID: ${idFilter}` : term && !interpreted ? `Global directory results for “${term}”. Category filters are cleared while searching.` : filter.description}</p>{filter.key === "utility" && <label>Utility sector <select aria-label="Utility sector" value={sector} onChange={e => { setSector(e.target.value); setPage(1); }}>{UTILITY_SECTORS.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}</select></label>}</div>
      <div className="cc-market-table-tools"><span>{market.isFetching ? "Updating…" : `${coins.length} assets · page ${page}`}</span><label><ArrowDownUp size={14}/>Sort this page <select aria-label="Sort assets on this page" value={sort} onChange={e => setSort(e.target.value as typeof sort)}><option value="marketCap">Market cap</option><option value="volume">Volume</option><option value="priceChange">24h change</option><option value="currentPrice">Price</option></select><button type="button" className="cc-sort-order" onClick={() => setAscending(v => !v)} aria-label={ascending ? "Sort descending" : "Sort ascending"}>{ascending ? "Low → high" : "High → low"}</button></label></div>
      {market.isError && <div className="cc-data-warning" role="status">{market.error.message} {market.data ? "The displayed snapshot may be stale." : "No substitute prices are shown."}</div>}
      <div className="cc-table-scroll"><table className="cc-market-table"><thead><tr><th scope="col">Asset</th><th scope="col">Price</th><th scope="col">24h change</th><th scope="col">24h volume</th><th scope="col">Market cap</th><th scope="col">Price history</th><th scope="col"><span className="cc-sr-only">Asset details</span></th></tr></thead><tbody>{coins.map(coin => <tr key={coin.id}><td><div className="cc-inline"><CoinIcon symbol={coin.symbol} image={coin.image}/><span><strong>{coin.name}</strong><small>{coin.symbol} · {coin.id}</small></span></div></td><td>{money(coin.currentPrice)}</td><td className={coin.priceChange === null ? "cc-muted" : coin.priceChange < 0 ? "cc-negative" : "cc-positive"}>{percent(coin.priceChange)}</td><td>{money(coin.volume, true)}</td><td>{money(coin.marketCap, true)}</td><td><Sparkline prices={coin.sparkline}/></td><td><button type="button" className="cc-button cc-analyze-link" onClick={() => setSelected(coin)} aria-label={`View ${coin.name} details`}>View <ArrowUpRight size={14}/></button></td></tr>)}</tbody></table></div>
      {!coins.length && <div className="cc-section-message" role="status"><Search size={27}/><h3>{market.isFetching || query.trim() !== term ? "Searching the market directory…" : market.isError ? "Unable to load this view" : "No priced assets returned"}</h3><p>{!market.isError && !market.isFetching ? "Try another name, ticker, or category. Coverage depends on the data provider." : "Use Refresh to retry when the provider is available."}</p></div>}
      <div className="cc-catalog-bottom"><FeedStatus timestamp={market.data?.updatedAt} error={market.isError} pending={market.isPending} refreshing={market.isFetching} onRefresh={() => void market.refetch()}/><div className="cc-pagination"><button type="button" disabled={page <= 1 || market.isFetching} onClick={() => { setPage(p => p - 1); setSelected(null); }}><ChevronLeft size={15}/>Previous</button><span>Page {page}</span><button type="button" disabled={!market.data?.hasMore || market.isFetching} onClick={() => { setPage(p => p + 1); setSelected(null); }}>Next<ChevronRight size={15}/></button></div></div>
    </section>
    <p className="cc-data-note">Data refreshes about every 60 seconds while this page is visible. A listing is not a trading recommendation or exchange listing. Missing values are shown as —. Utility is grouped by provider sectors.</p>
    <Dialog.Root open={Boolean(selected)} onOpenChange={open => { if (!open) setSelected(null); }}><Dialog.Portal><Dialog.Overlay className="cc-modal-backdrop"/><Dialog.Content className="cc-dialog cc-coin-dialog"><div className="cc-panel-heading"><div className="cc-inline">{selected && <CoinIcon symbol={selected.symbol} image={selected.image} size={42}/>}<div><Dialog.Title>{selected?.name}</Dialog.Title><span className="cc-muted">{selected?.symbol} · {selected?.id}</span></div></div><Dialog.Close className="cc-icon-button" aria-label="Close asset details"><X size={19}/></Dialog.Close></div><Dialog.Description className="cc-muted">CoinGecko market snapshot · USD reference prices</Dialog.Description>{selected && <><div className="cc-quote-hero"><strong>{money(selected.currentPrice)}</strong><span className={selected.priceChange !== null && selected.priceChange < 0 ? "cc-negative" : "cc-positive"}>{percent(selected.priceChange)} <small>24h</small></span></div><dl className="cc-quote-metrics"><div><dt>Market cap</dt><dd>{money(selected.marketCap, true)}</dd></div><div><dt>24h volume</dt><dd>{money(selected.volume, true)}</dd></div><div><dt>Provider timestamp</dt><dd>{selected.providerUpdatedAt ? new Date(selected.providerUpdatedAt).toLocaleString() : "Unavailable"}</dd></div></dl>{isSnapshotStale(selected.providerUpdatedAt) && <p className="cc-data-warning">Provider timestamp is missing or older than three minutes. Treat this quote as delayed.</p>}<div className="cc-quote-actions">{terminalSymbolForId(selected.id) ? <Link className="cc-button cc-button-primary" href={workstationHref(terminalSymbolForId(selected.id)!, { analyze: true })}>Analyze in workstation<ArrowUpRight size={15}/></Link> : <p className="cc-muted">Market data is available; workstation analysis for this asset is not connected in the current backend.</p>}<a href={`https://www.coingecko.com/en/coins/${selected.id}`} target="_blank" rel="noopener noreferrer" className="cc-button">Provider details<ArrowUpRight size={14}/></a></div></>}</Dialog.Content></Dialog.Portal></Dialog.Root>
  </div>;
}
