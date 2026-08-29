"use client";
import { useState } from "react";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowUpRight, Plus, RefreshCw, Star, X } from "lucide-react";
import { useAssetRecords, useAssetSearch, useWatchlist, useWatchlists, useWatchlistMutation } from "@/hooks/useTerminalAccount";
import { useMarketSnapshot } from "@/hooks/useMarketSnapshot";
import useDebounce from "@/hooks/useDebounce";
import { backendError } from "@/hooks/useWorkspaceData";
import { money, percent } from "@/lib/market-data";
import { validPair } from "@/lib/terminal-market";
import { workstationHref } from "@/lib/workspace-navigation";
import { AssetIcon } from "./WorkspaceUI";

export default function UserWatchlist({ compact = false }: { compact?: boolean }) {
  const [page, setPage] = useState(1), [selected, setSelected] = useState("");
  const lists = useWatchlists(page);
  const id = lists.data?.items.some(w => w.id === selected) ? selected : lists.data?.items[0]?.id;
  const list = useWatchlist(id);
  const [itemPage, setItemPage] = useState(0);
  const items = (list.data?.items ?? []).slice(itemPage * 25, (itemPage + 1) * 25);
  const assetIds = [...new Set(items.map(item => item.asset_id))];
  const assets = useAssetRecords(assetIds);
  const market = useMarketSnapshot();
  const [open, setOpen] = useState(false), [creating, setCreating] = useState(false);
  const [name, setName] = useState(""), [search, setSearch] = useState("");
  const debounced = useDebounce(search, 350);
  const matches = useAssetSearch(open && !creating ? debounced : "");
  const mutation = useWatchlistMutation();
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  async function save(assetId?: string) {
    if (busy) return;
    setBusy(true); setError("");
    try {
      if (creating) {
        if (!name.trim() || name.trim().length > 255) throw new Error("Invalid name");
        const created = await mutation.create(name.trim());
        if (typeof created?.id === "string") setSelected(created.id);
      } else if (id && assetId) await mutation.add(id, assetId);
      setOpen(false); setName(""); setSearch("");
    } catch (e) { setError(backendError(e)); } finally { setBusy(false); }
  }
  return <section className={`cc-card cc-user-watchlist ${compact ? "is-compact" : ""}`}>
    <div className="cc-card-heading"><div className="cc-inline"><Star size={17}/><div><span className="cc-eyebrow">Saved by you</span><h2>Your watchlist</h2></div></div><div className="cc-inline"><button type="button" className="cc-icon-button" title="Refresh watchlist" aria-label="Refresh watchlist" onClick={() => { void lists.refetch(); if (id) void list.refetch(); }}><RefreshCw size={14}/></button><button type="button" className="cc-icon-button" aria-label="Create watchlist" title="Create watchlist" onClick={() => { setCreating(true); setError(""); setOpen(true); }}><Plus size={17}/></button></div></div>
    {lists.isPending ? <p className="cc-section-message">Loading your watchlists…</p> : lists.isError ? <p className="cc-section-message" role="status">{backendError(lists.error)}</p> : !lists.data?.items.length ? <div className="cc-section-message"><Star size={24}/><h3>No watchlist yet</h3><p>Save the markets you want to follow.</p><button className="cc-button" onClick={() => { setCreating(true); setOpen(true); }}>Create watchlist</button></div> : <>
      <div className="cc-watchlist-select"><select aria-label="Choose your watchlist" value={id ?? ""} onChange={e => { setSelected(e.target.value); setItemPage(0); }}>{lists.data.items.map(w => <option value={w.id} key={w.id}>{w.name}</option>)}</select><button type="button" className="cc-text-button" onClick={() => { setCreating(false); setError(""); setOpen(true); }}><Plus size={13}/> Add asset</button></div>
      {list.isPending ? <p className="cc-section-message">Loading saved assets…</p> : list.isError ? <p className="cc-section-message">{backendError(list.error)}</p> : !items.length ? <p className="cc-section-message">This watchlist is empty. Add an asset to start following it.</p> : <div className="cc-watchlist-rows">{items.map((item, index) => {
        const assetQuery = assets[assetIds.indexOf(item.asset_id)];
        const asset = assetQuery?.data;
        const coin = market.data?.coins.find(c => c.symbol === asset?.base_asset);
        return <div className="cc-watchlist-row" key={item.id}><div className="cc-inline">{coin && <AssetIcon symbol={coin.symbol} size={27}/>}<span><strong>{asset?.symbol ?? (assetQuery?.isError ? "Asset unavailable" : "Loading…")}</strong><small>{asset?.name ?? "Saved asset"}</small></span></div><div><strong>{money(coin?.currentPrice)}</strong><small className={coin && coin.priceChange < 0 ? "cc-negative" : "cc-positive"}>{percent(coin?.priceChange)}</small></div>{asset && validPair(`${asset.base_asset}USDT`) ? <Link aria-label={`Analyze ${asset.base_asset} in workstation`} href={workstationHref(asset.base_asset, { analyze: true })}><ArrowUpRight size={16}/></Link> : <span title="This market is not supported by the crypto workstation">—</span>}</div>;
      })}</div>}
      {(list.data?.items.length ?? 0) > 25 && <div className="cc-watchlist-pager"><button disabled={!itemPage} onClick={() => setItemPage(p => p - 1)}>Previous assets</button><span>{itemPage + 1}</span><button disabled={(itemPage + 1) * 25 >= (list.data?.items.length ?? 0)} onClick={() => setItemPage(p => p + 1)}>Next assets</button></div>}
      <p className="cc-data-note">Saved in your account · {market.isError ? "Price update failed; last snapshot shown" : "CoinGecko USD reference prices"}. Analyze opens the corresponding USDT market.</p>
    </>}
    {(lists.data?.total ?? 0) > 25 && <div className="cc-watchlist-pager"><button disabled={page === 1} onClick={() => { setPage(p => p - 1); setItemPage(0); }}>Previous lists</button><span>{page}</span><button disabled={page * 25 >= (lists.data?.total ?? 0)} onClick={() => { setPage(p => p + 1); setItemPage(0); }}>Next lists</button></div>}
    <Dialog.Root open={open} onOpenChange={value => { if (!busy) setOpen(value); }}><Dialog.Portal><Dialog.Overlay className="cc-modal-backdrop"/><Dialog.Content className="cc-dialog cc-watchlist-modal"><div className="cc-panel-heading"><Dialog.Title>{creating ? "Create watchlist" : "Add a saved asset"}</Dialog.Title><Dialog.Close className="cc-icon-button" aria-label="Close watchlist editor"><X size={18}/></Dialog.Close></div><Dialog.Description>{creating ? "This list will be saved to your CoinCrest account." : "Choose an asset from your backend’s asset catalog."}</Dialog.Description>
      {creating ? <form onSubmit={e => { e.preventDefault(); void save(); }}><label>Watchlist name<input value={name} maxLength={255} onChange={e => setName(e.target.value)} autoFocus required placeholder="My markets"/></label><button className="cc-button cc-button-primary" disabled={busy || !name.trim()}>{busy ? "Saving…" : "Create watchlist"}</button></form> : <><label>Search assets<input value={search} onChange={e => setSearch(e.target.value)} placeholder="Bitcoin or BTC" autoFocus/></label><div className="cc-asset-results">{!search.trim() ? <p>Type a symbol or asset name.</p> : matches.isPending ? <p>Searching…</p> : matches.isError ? <p>{backendError(matches.error)}</p> : !matches.data?.items.length ? <p>No matching assets.</p> : matches.data.items.map(a => <button key={a.id} disabled={busy || list.data?.items.some(item => item.asset_id === a.id)} onClick={() => void save(a.id)}><span><strong>{a.symbol}</strong><small>{a.name} · {a.exchange}</small></span><Plus size={16}/></button>)}</div></>}
      {error && <p role="alert" className="cc-error">{error}</p>}
    </Dialog.Content></Dialog.Portal></Dialog.Root>
  </section>;
}
