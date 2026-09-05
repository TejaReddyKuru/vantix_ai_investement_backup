"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import FridayPanel from "./FridayPanel";
import NotificationWidget from "./NotificationWidget";
import PrivacyPolicyModal from "@/components/legal/PrivacyPolicyModal";
import { WorkspaceContext } from "./WorkspaceContext";
import { useAuth } from "@/context/AuthContext";
import { useHydrated } from "@/hooks/useWorkspaceData";
import { safeReturnPath } from "@/lib/workspace-navigation";
import "./workspace.css";
import MarketTicker from "@/components/market/MarketTicker";
import { ASSETS } from "@/lib/market-data";
import { useWorkspacePreference } from "@/hooks/useWorkspacePreference";
import { parseNavigationMode, type NavigationMode } from "@/lib/workspace-layout";
import "./workspace-v6.css";
import "./premium-workspace-v9.css";

export default function DashboardShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [ahnaOpen, setAhnaOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [assetContext, setAssetContext] = useState<{ symbol: string; id: string | null }>({ symbol: "BTC", id: "bitcoin" });
  const activeSymbol = assetContext.symbol, activeCoinId = assetContext.id;
  const setActiveSymbol = useCallback((symbol: string) => setAssetContext({ symbol, id: ASSETS.find(asset => asset.symbol === symbol)?.id ?? null }), []);
  const selectAsset = useCallback((symbol: string, id: string) => setAssetContext({ symbol, id }), []);
  const pathname = usePathname();
  const { user, token } = useAuth();
  const [navigation, setNavigation] = useWorkspacePreference<NavigationMode>(
    `coincrest:navigation:v7:${user?.id ?? "guest"}`, "expanded", parseNavigationMode,
  );
  const navigationMode: NavigationMode = navigation === "hidden" ? "rail" : navigation;
  const toggleSidebar = () => {
    setNavigation(current => current === "expanded" ? "rail" : "expanded");
  };
  useEffect(() => {
    if (navigation === "hidden") setNavigation("rail");
  }, [navigation, setNavigation]);
  const hydrated = useHydrated();
  const router = useRouter();
  useEffect(() => {
    if (hydrated && (!user || !token)) {
      const next = safeReturnPath(
        window.location.pathname +
          window.location.search +
          window.location.hash,
      );
      router.replace(`/login?next=${encodeURIComponent(next)}`);
    }
  }, [hydrated, user, token, router]);
  const openAhna = useCallback(() => setAhnaOpen(true), []);
  const openNotifications = useCallback(() => setNotificationsOpen(true), []);
  const [latestAhnaAnalysis, setLatestAhnaAnalysisState] = useState<Record<string, import("@/lib/ahna-types").AHNAAnalysisResponse>>({});
  const setLatestAhnaAnalysis = useCallback((symbol: string, analysis: import("@/lib/ahna-types").AHNAAnalysisResponse) => {
    setLatestAhnaAnalysisState(prev => ({ ...prev, [symbol]: analysis }));
  }, []);
  const controls = useMemo(
    () => ({ openAhna, openNotifications, activeSymbol, activeCoinId, setActiveSymbol, selectAsset, latestAhnaAnalysis, setLatestAhnaAnalysis }),
    [openAhna, openNotifications, activeSymbol, activeCoinId, setActiveSymbol, selectAsset, latestAhnaAnalysis, setLatestAhnaAnalysis],
  );
  useEffect(() => {
    // Preserve existing page actions while moving the visible product name to AHNA.
    window.addEventListener("open-friday", openAhna);
    window.addEventListener("open-ahna", openAhna);
    window.addEventListener("open-notifications", openNotifications);
    const url = new URL(window.location.href);
    if (url.searchParams.get("notifications") === "open") {
      openNotifications();
      url.searchParams.delete("notifications");
      window.history.replaceState(
        window.history.state,
        "",
        url.pathname + url.search + url.hash,
      );
    }
    return () => {
      window.removeEventListener("open-friday", openAhna);
      window.removeEventListener("open-ahna", openAhna);
      window.removeEventListener("open-notifications", openNotifications);
    };
  }, [openAhna, openNotifications, pathname]);
  const legacyDemoPage = ["/journal"].includes(
    pathname,
  );
  return (
    <WorkspaceContext.Provider value={controls}>
      <div className={`cc-app cc-workspace-v6 cc-workspace-v8 cc-nav-${navigationMode} ${ahnaOpen ? "cc-ahna-is-open" : ""} ${pathname === "/paper-trading" ? "cc-terminal-shell cc-desktop-surface" : ""} ${pathname === "/community" ? "cc-community-shell cc-desktop-surface" : ""}`}>
        <a href="#workspace-main" className="cc-skip-link">
          Skip to workspace
        </a>
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} collapsed={navigationMode === "rail"} onCollapse={toggleSidebar} />
        <div className="cc-workspace">
          <TopBar
            onMenuClick={() => setSidebarOpen(true)}
            ahnaOpen={ahnaOpen}
            onAhnaToggle={() => setAhnaOpen((open) => !open)}
            onNotificationsOpen={openNotifications}
            notificationsOpen={notificationsOpen}
          />
          {hydrated && user && token && <MarketTicker />}
          <main id="workspace-main" className="cc-main">
            {legacyDemoPage && (
              <div className="cc-legacy-notice">
                Interface preview · account figures and analysis on this page
                are demonstration data until backend integration is completed.
              </div>
            )}
            {hydrated && user && token ? (
              children
            ) : (
              <div className="cc-section-message" role="status">
                Opening your workspace…
              </div>
            )}
          </main>
        </div>
        <FridayPanel
          key={`friday-${user?.id ?? "guest"}`}
          open={ahnaOpen}
          onClose={() => setAhnaOpen(false)}
        />
        <NotificationWidget
          key={`notif-${user?.id ?? "guest"}`}
          open={notificationsOpen}
          onOpenChange={setNotificationsOpen}
        />
        <PrivacyPolicyModal />
      </div>
    </WorkspaceContext.Provider>
  );
}
