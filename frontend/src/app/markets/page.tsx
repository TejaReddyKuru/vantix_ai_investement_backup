"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useHydrated } from "@/hooks/useWorkspaceData";
import DashboardShell from "@/components/dashboard/DashboardShell";
import CoinCrestBrand from "@/components/branding/CoinCrestBrand";
import SiteFooter from "@/components/landing/SiteFooter";
import MarketExplorer from "@/components/market/MarketExplorer";
import MarketTicker from "@/components/market/MarketTicker";
import { ThemeControl } from "@/context/ThemeContext";
import "@/components/dashboard/workspace.css";

export default function MarketsPage() {
  const { user, token } = useAuth();
  const hydrated = useHydrated();

  if (!hydrated) {
    return (
      <div className="cc-app">
        <p className="cc-section-message">Opening markets…</p>
      </div>
    );
  }

  if (user && token) {
    return (
      <DashboardShell>
        <MarketExplorer />
      </DashboardShell>
    );
  }

  return (
    <div className="cc-app cc-public-markets">
      <header className="cc-public-header">
        <Link href="/" aria-label="CoinCrest home">
          <CoinCrestBrand />
        </Link>
        <nav aria-label="Public navigation">
          <Link href="/markets" aria-current="page">
            Markets
          </Link>
          <Link href="/about">About</Link>
          <ThemeControl />
          <Link className="cc-button" href="/login?next=%2Fmarkets">
            Log in
          </Link>
          <Link className="cc-button cc-button-primary" href="/register">
            Get started
          </Link>
        </nav>
      </header>
      <MarketTicker />
      <main className="cc-public-main">
        <MarketExplorer />
      </main>
      <SiteFooter />
    </div>
  );
}
