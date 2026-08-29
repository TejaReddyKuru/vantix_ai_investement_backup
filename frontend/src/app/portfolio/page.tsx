"use client";
import Link from "next/link";
import { ArrowUpRight, PieChart } from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import {
  LiveAccountCard,
  PaperAccountCard,
} from "@/components/dashboard/AccountCards";
import {
  usePaperAccount,
  usePaperSummary,
  backendError,
} from "@/hooks/useWorkspaceData";
import { accountAmount } from "@/lib/workspace-data";
import { workstationHref } from "@/lib/workspace-navigation";

function PortfolioContent() {
  const account = usePaperAccount(),
    summary = usePaperSummary();
  return (
    <div className="cc-page">
      <div className="cc-page-heading">
        <div>
          <span className="cc-eyebrow">Your capital, clearly separated</span>
          <h1>
            Portfolio<span className="cc-title-dot">.</span>
          </h1>
          <p>
            Real-account visibility and paper performance, without mixing the
            two.
          </p>
        </div>
        <Link
          className="cc-button cc-button-primary"
          href={workstationHref("BTC", { mode: "live" })}
        >
          Open workstation <ArrowUpRight size={15} />
        </Link>
      </div>
      <div className="cc-overview-top">
        <LiveAccountCard />
        <section className="cc-card">
          <div className="cc-card-heading">
            <div>
              <span className="cc-eyebrow">Real investments</span>
              <h2>Holdings & allocation</h2>
            </div>
            <PieChart size={20} />
          </div>
          <div className="cc-section-message">
            <h3>Live holdings aren’t available yet</h3>
            <p>
              The current account API does not expose live balances or
              positions. This area will show your holdings once that integration
              is available.
            </p>
            <Link
              href="/settings#broker-connections"
              className="cc-text-button"
            >
              View broker connections <ArrowUpRight size={14} />
            </Link>
          </div>
        </section>
      </div>
      <section className="cc-card cc-paper-performance">
        <div className="cc-card-heading">
          <div>
            <span className="cc-eyebrow">Paper account only</span>
            <h2>Recorded paper performance</h2>
          </div>
          <span className="cc-status-tag cc-tag-gold">Simulated</span>
        </div>
        <div className="cc-paper-stats">
          <div>
            <span>Invested paper value</span>
            <strong>
              {accountAmount(
                summary.data?.invested_value,
                account.data?.currency,
              )}
            </strong>
          </div>
          <div>
            <span>Realized paper P&amp;L</span>
            <strong>
              {accountAmount(
                summary.data?.realized_pnl,
                account.data?.currency,
              )}
            </strong>
          </div>
          <div>
            <span>Unrealized paper P&amp;L</span>
            <strong>
              {accountAmount(
                summary.data?.unrealized_pnl,
                account.data?.currency,
              )}
            </strong>
          </div>
        </div>
        {summary.isError && (
          <p className="cc-data-note" role="status">
            {backendError(summary.error)}
          </p>
        )}
        <p className="cc-data-note">
          Values come from the latest stored paper portfolio summary. They are
          not live-account holdings, and are not labelled as today’s P&amp;L
          because the response supplies no daily period.
        </p>
      </section>
      <PaperAccountCard />
    </div>
  );
}
export default function PortfolioPage() {
  return (
    <DashboardShell>
      <PortfolioContent />
    </DashboardShell>
  );
}
