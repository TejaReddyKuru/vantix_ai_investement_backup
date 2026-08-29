"use client";
import { useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { useAssetDirectory } from "@/hooks/useAssetDirectory";
import { terminalSymbolForId, type DirectoryAsset } from "@/lib/asset-directory";
import CoinIcon from "./CoinIcon";

export default function AssetPicker({ value, onSelect, terminalOnly = false }: { value: DirectoryAsset; onSelect: (asset: DirectoryAsset) => void; terminalOnly?: boolean }) {
  const [open, setOpen] = useState(false), [query, setQuery] = useState("");
  const input = useRef<HTMLInputElement>(null), list = useRef<HTMLUListElement>(null);
  const directory = useAssetDirectory(query, open);
  const assets = directory.assets.slice(0, 80);
  const choose = (asset: DirectoryAsset) => {
    if (terminalOnly && !terminalSymbolForId(asset.id)) return;
    onSelect(asset); setOpen(false); setQuery("");
  };
  return <Dialog.Root open={open} onOpenChange={next => { setOpen(next); if (!next) setQuery(""); }}>
    <Dialog.Trigger asChild><button className="cc-asset-picker-trigger" type="button" aria-label={`Search and select coin; current ${value.name}`}>
      <CoinIcon symbol={value.symbol} image={value.image} size={29}/><span><strong>{value.symbol}</strong><small>{value.name}</small></span><Search size={16}/><ChevronDown size={13}/>
    </button></Dialog.Trigger>
    <Dialog.Portal><Dialog.Overlay className="cc-modal-backdrop"/><Dialog.Content className="cc-dialog cc-asset-picker-dialog" onOpenAutoFocus={event => { event.preventDefault(); input.current?.focus(); }}>
      <div className="cc-panel-heading"><div><Dialog.Title>Choose your market</Dialog.Title><Dialog.Description>{terminalOnly ? "Connected USDT markets for this workstation." : "Search by name or ticker, then inspect all six agent outputs."}</Dialog.Description></div><Dialog.Close className="cc-icon-button" aria-label="Close coin search"><X size={18}/></Dialog.Close></div>
      <label className="cc-asset-search-field"><Search size={18}/><input ref={input} value={query} maxLength={100} onChange={e => setQuery(e.target.value)} placeholder="Bitcoin, Ethereum, USD Coin…" aria-label="Search coins" autoComplete="off" onKeyDown={e => {
        if (e.key === "ArrowDown") { e.preventDefault(); list.current?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus(); }
      }}/></label>
      <p className="cc-picker-source" role="status">{directory.searching ? "Searching directory…" : directory.isError ? "Directory unavailable. Showing matching local metadata only." : directory.metadataOnly ? "Quick picks · names only, not quotes" : "CoinGecko directory · IDs distinguish duplicate tickers"}</p>
      <ul ref={list} className="cc-asset-picker-results" aria-label="Coin search results" onKeyDown={e => {
        if (!["ArrowUp", "ArrowDown"].includes(e.key)) return;
        const buttons = Array.from(list.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? []);
        const index = buttons.indexOf(document.activeElement as HTMLButtonElement), next = index + (e.key === "ArrowDown" ? 1 : -1);
        if (next >= 0 && next < buttons.length) { e.preventDefault(); buttons[next].focus(); }
        else if (next < 0) { e.preventDefault(); input.current?.focus(); }
      }}>{assets.map(asset => {
        const connected = Boolean(terminalSymbolForId(asset.id));
        return <li key={asset.id}><button type="button" disabled={terminalOnly && !connected} onClick={() => choose(asset)}>
          <CoinIcon symbol={asset.symbol} image={asset.image}/><span><strong>{asset.name}</strong><small>{asset.symbol} · {asset.id}</small></span><span className={connected ? "is-connected" : ""}>{connected ? "Six-agent pipeline" : "Not connected yet"}</span>{asset.id === value.id && <Check size={15}/>}
        </button></li>;
      })}</ul>
      {!assets.length && <p className="cc-picker-empty">{directory.searching ? "Waiting for directory results…" : "No matching coin found. Try its full name or ticker."}</p>}
      <p className="cc-picker-foot">{terminalOnly ? "Other assets remain available on Markets; chart and agent support must be connected separately." : "Selecting an unconnected asset clears previous results and shows its integration status. No substitute Bitcoin analysis is shown."}</p>
    </Dialog.Content></Dialog.Portal>
  </Dialog.Root>;
}
