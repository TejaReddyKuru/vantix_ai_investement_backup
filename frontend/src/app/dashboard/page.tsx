"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Bell,
  CandlestickChart,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import {
  LiveAccountCard,
  PaperAccountCard,
} from "@/components/dashboard/AccountCards";
import NewsFeed from "@/components/dashboard/NewsFeed";
import MarketPulse from "@/components/dashboard/MarketPulse";
import UserWatchlist from "@/components/dashboard/UserWatchlist";
import SessionBriefing from "@/components/dashboard/SessionBriefing";
import { useWorkspace } from "@/components/dashboard/WorkspaceContext";
import { useAuth } from "@/context/AuthContext";
import { useHydrated } from "@/hooks/useWorkspaceData";
import { workstationHref } from "@/lib/workspace-navigation";

function Overview() {
  const { user } = useAuth();
  const hydrated = useHydrated();
  const { openAhna, openNotifications } = useWorkspace();
  const name =
    hydrated && user?.display_name ? user.display_name.split(" ")[0] : "there";
  
  const [activeMode, setActiveMode] = useState<"live" | "paper">("live");

  return (
    <div className="cc-page cc-user-overview">
      <div className="cc-page-heading cc-personal-heading">
        <div>
          <span className="cc-eyebrow">Your daily overview</span>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "5px" }}>
            <h1 style={{ marginTop: 0 }}>
              Welcome back, <em>{name}.</em>
            </h1>
            <div className="cc-segmented">
              <button 
                type="button" 
                aria-pressed={activeMode === "live"}
                onClick={() => setActiveMode("live")}
              >
                Live
              </button>
              <button 
                type="button" 
                aria-pressed={activeMode === "paper"}
                onClick={() => setActiveMode("paper")}
              >
                Paper
              </button>
            </div>
          </div>
          <p>Your capital, the markets, and what matters next.</p>
        </div>
        <Link
          href={workstationHref("BTC", { mode: activeMode })}
          className="cc-button cc-button-primary"
        >
          <CandlestickChart size={16} /> Open workstation{" "}
          <ArrowUpRight size={15} />
        </Link>
      </div>
      <div className="cc-overview-top">
        {activeMode === "live" ? <LiveAccountCard /> : <PaperAccountCard />}
        <aside className="cc-ahna-overview">
          <div className="cc-ahna-overview-top">
            <span className="cc-ahna-orbit">
              <Sparkles size={25} />
            </span>
            <span>AHNA INTELLIGENCE</span>
          </div>
          <h2>
            Context before
            <br />
            <em>your next move.</em>
          </h2>
          <p>
            Review technical signals, news sentiment and the evidence behind a
            market’s direction.
          </p>
          <div className="cc-ahna-capabilities">
            <span>Market analysis</span>
            <span>News sentiment</span>
            <span>Risk context</span>
          </div>
          <button
            type="button"
            className="cc-button cc-button-light"
            onClick={openAhna}
          >
            Open AHNA <ArrowUpRight size={15} />
          </button>
          <small>Analysis only. You stay in control of every trade.</small>
        </aside>
      </div>
      <div className="cc-overview-middle">
        <div className="cc-overview-main-stack"><SessionBriefing /><NewsFeed /></div>
        <div className="cc-overview-market-rail"><UserWatchlist /><MarketPulse /></div>
      </div>
      <div className="cc-overview-links">
        <Link href="/community">
          <span className="cc-icon-tile">
            <MessageSquare size={20} />
          </span>
          <div>
            <span className="cc-eyebrow">Other perspectives</span>
            <h2>Community</h2>
            <p>Research ideas, with sources and risk in view.</p>
          </div>
          <ArrowUpRight size={18} />
        </Link>
        <button type="button" onClick={openNotifications}>
          <span className="cc-icon-tile">
            <Bell size={20} />
          </span>
          <div>
            <span className="cc-eyebrow">Stay up to date</span>
            <h2>Your notifications</h2>
            <p>Account updates and alerts, without leaving your workspace.</p>
          </div>
          <ArrowUpRight size={18} />
        </button>
      </div>
      <footer className="cc-overview-footer">
        <span>CoinCrest · Clarity before every decision.</span>
        <span>Real and paper capital are always kept separate.</span>
      </footer>
    </div>
  );
}
export default function DashboardPage() {
  return (
    <DashboardShell>
      <Overview />
    </DashboardShell>
  );
}
