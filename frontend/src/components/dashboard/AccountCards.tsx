"use client";
import Link from "next/link";
import {
  ArrowUpRight,
  FlaskConical,
  Link2,
  RefreshCw,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import {
  useBrokerConnections,
  usePaperAccount,
  usePaperSummary,
  backendError,
} from "@/hooks/useWorkspaceData";
import { accountAmount, dateLabel } from "@/lib/workspace-data";
import { workstationHref } from "@/lib/workspace-navigation";

export function LiveAccountCard() {
  const brokers = useBrokerConnections();
  const live =
    brokers.data?.filter(
      (item) =>
        item.broker.toUpperCase() !== "PAPER" &&
        ["LIVE", "PRODUCTION", "MAINNET", "REAL"].includes(
          item.environment.toUpperCase(),
        ),
    ) ?? [];
  return (
    <section
      className="cc-card cc-capital-card"
      aria-labelledby="real-account-title"
      data-account-mode="live"
    >
      <div className="cc-card-heading">
        <div className="cc-inline">
          <span className="cc-icon-tile">
            <Wallet size={19} />
          </span>
          <div>
            <span className="cc-eyebrow">Your money</span>
            <h2 id="real-account-title">Real account</h2>
          </div>
        </div>
        <span className="cc-status-tag">Live capital</span>
      </div>
      <div className="cc-capital-value">
        <span>Portfolio value</span>
        <strong aria-label="Live portfolio value unavailable">—</strong>
        <p>Live balances aren’t available yet.</p>
      </div>
      <div className="cc-capital-breakdown">
        <div>
          <span>Available cash</span>
          <strong>—</strong>
        </div>
        <div>
          <span>Total P&amp;L</span>
          <strong>—</strong>
        </div>
        <div>
          <span>Account currency</span>
          <strong>—</strong>
        </div>
      </div>
      <div className="cc-capital-foot">
        <span>
          <ShieldCheck size={15} />
          {brokers.isPending
            ? "Checking account connections…"
            : brokers.isError
              ? "Connection status unavailable"
              : live.length
                ? `${live.length} live-environment broker link${live.length === 1 ? "" : "s"}`
                : "No live-environment broker linked"}
        </span>
        <Link href="/settings#broker-connections">
          View connections <ArrowUpRight size={14} />
        </Link>
      </div>
      <p className="cc-data-note">
        Your backend currently exposes connection status, not a verified
        live-account balance. Paper funds are shown separately below.
      </p>
    </section>
  );
}
export function PaperAccountCard() {
  const account = usePaperAccount(),
    summary = usePaperSummary();
  const currency = account.data?.currency;
  const failed = account.isError || summary.isError;
  return (
    <section
      className="cc-paper-account"
      aria-labelledby="paper-account-title"
      data-account-mode="paper"
    >
      <div className="cc-paper-intro">
        <span className="cc-icon-tile">
          <FlaskConical size={20} />
        </span>
        <div>
          <span className="cc-eyebrow">Practice, separately</span>
          <h2 id="paper-account-title">Your paper account</h2>
          <p>Simulated funds. Not part of your real balance.</p>
        </div>
        <span className="cc-status-tag cc-tag-gold">Paper</span>
      </div>
      <div className="cc-paper-stats">
        <div>
          <span>Available paper cash</span>
          <strong>{accountAmount(account.data?.current_cash, currency)}</strong>
        </div>
        <div>
          <span>Paper portfolio equity</span>
          <strong>{accountAmount(summary.data?.total_equity, currency)}</strong>
        </div>
        <div>
          <span>Realized paper P&amp;L</span>
          <strong>{accountAmount(summary.data?.realized_pnl, currency)}</strong>
        </div>
      </div>
      {failed && (
        <p className="cc-inline-error" role="status">
          {backendError(account.error ?? summary.error)}
        </p>
      )}
      <div className="cc-paper-footer">
        <small>
          {account.isPending
            ? "Loading your paper account…"
            : account.data
              ? `Account updated ${dateLabel(account.data.updated_at)}`
              : "Paper-account data unavailable"}
        </small>
        <div className="cc-inline">
          <button
            type="button"
            className="cc-icon-button"
            aria-label="Refresh paper account"
            disabled={account.isFetching || summary.isFetching}
            onClick={() => {
              void account.refetch();
              void summary.refetch();
            }}
          >
            <RefreshCw size={15} />
          </button>
          <Link
            className="cc-button cc-button-secondary"
            href={workstationHref("BTC", { mode: "paper" })}
          >
            Open paper workstation <ArrowUpRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}
export function BrokerConnectionsCard() {
  const query = useBrokerConnections();
  return (
    <section id="broker-connections" className="cc-card cc-broker-card">
      <div className="cc-card-heading">
        <div>
          <span className="cc-eyebrow">Account connections</span>
          <h2>Broker connections</h2>
        </div>
        <button
          className="cc-icon-button"
          type="button"
          aria-label="Refresh broker connections"
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          <RefreshCw size={16} />
        </button>
      </div>
      {query.isPending ? (
        <p className="cc-section-message">Loading connection status…</p>
      ) : query.isError ? (
        <p className="cc-section-message" role="status">
          {backendError(query.error)}
        </p>
      ) : !query.data?.length ? (
        <div className="cc-section-message">
          <Link2 size={25} />
          <h3>No broker connections yet</h3>
          <p>
            When a broker is linked through the account service, its environment
            and connection status appear here.
          </p>
        </div>
      ) : (
        <ul className="cc-broker-list">
          {query.data.map((item, index) => (
            <li key={item.id || `${item.broker}-${index}`}>
              <div>
                <strong>{item.broker}</strong>
                <small>{item.environment} environment</small>
              </div>
              <span className="cc-status-tag">{item.status}</span>
              <small>
                {item.last_verified_at
                  ? `Verified ${dateLabel(item.last_verified_at)}`
                  : "Not verified"}
              </small>
            </li>
          ))}
        </ul>
      )}
      <p className="cc-data-note">
        A saved connection is not proof that a balance is synced or that live
        execution is enabled. Broker credentials are never displayed here.
      </p>
    </section>
  );
}
