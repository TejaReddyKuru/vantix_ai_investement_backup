"use client";
import { useState } from "react";
import { useTradingMode } from "@/context/TradingModeContext";
import { usePaperAccount, usePrivateQuery, backendError } from "@/hooks/useWorkspaceData";
import { useAssetRecords } from "@/hooks/useTerminalAccount";
import { collection } from "@/lib/terminal-account";
import { isRecord } from "@/lib/market-data";

export default function AccountOrders() {
  const { isPaper } = useTradingMode();
  const account = usePaperAccount();
  const [kind, setKind] = useState<"orders" | "positions">("positions"), [page, setPage] = useState(1);
  const query = usePrivateQuery(`paper-${kind}`, `/api/v1/paper-trading/${kind}?page=${page}&page_size=25`, value => {
    const list = collection(value);
    const items = list.items.map(item => {
      if (!isRecord(item) || item.paper_account_id !== account.data?.id || typeof item.asset_id !== "string") throw new Error("Account record does not match this paper account");
      return item;
    });
    return { ...list, items };
  }, isPaper && Boolean(account.data));
  const records = isPaper ? query.data?.items ?? [] : [];
  const ids = [...new Set(records.map(r => String(r.asset_id)))];
  const assets = useAssetRecords(ids);
  const identity = Object.fromEntries(ids.map((id, i) => [id, assets[i]?.data?.symbol ?? "Loading asset…"]));
  const val = (record: Record<string, unknown>, key: string) => typeof record[key] === "string" || typeof record[key] === "number" ? String(record[key]) : "—";
  return <section className="ct-panel ct-account-orders"><header className="ct-panel-tabs"><button aria-pressed={kind === "positions"} onClick={() => { setKind("positions"); setPage(1); }}>Positions</button><button aria-pressed={kind === "orders"} onClick={() => { setKind("orders"); setPage(1); }}>Open orders</button><span>{isPaper ? "Paper account" : "Live account"}</span></header>{!isPaper ? <p className="ct-empty">Live orders and positions are not exposed by the connected account integration. Paper records are kept separate.</p> : account.isError ? <p className="ct-empty">{backendError(account.error)}</p> : query.isPending ? <p className="ct-empty">Loading your paper {kind}…</p> : query.isError ? <p className="ct-empty">{backendError(query.error)} The list response must include the matching paper-account ID.<button onClick={() => void query.refetch()}>Retry</button></p> : !records.length ? <p className="ct-empty">No paper {kind} returned for this account.</p> : <div className="ct-records-scroll"><table><thead><tr><th>Instrument</th>{kind === "orders" ? <><th>Side</th><th>Type</th><th>Quantity</th><th>Requested price</th><th>Status</th></> : <><th>Quantity</th><th>Average entry</th><th>Unrealized P&amp;L</th></>}</tr></thead><tbody>{records.map((r, i) => <tr key={val(r, "id") === "—" ? i : val(r, "id")}><td>{identity[String(r.asset_id)]}</td>{kind === "orders" ? <><td>{val(r, "side")}</td><td>{val(r, "order_type")}</td><td>{val(r, "quantity")}</td><td>{val(r, "requested_price")}</td><td>{val(r, "status")}</td></> : <><td>{val(r, "quantity")}</td><td>{val(r, "average_entry_price")}</td><td>{val(r, "unrealized_pnl")}</td></>}</tr>)}</tbody></table></div>}<div className="ct-records-footer"><small>Backend records only · {account.data?.currency ?? "currency unavailable"}</small>{isPaper && (query.data?.total ?? 0) > 25 && <div><button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button><span>{page}</span><button disabled={page * 25 >= (query.data?.total ?? 0)} onClick={() => setPage(p => p + 1)}>Next</button></div>}</div></section>;
}
