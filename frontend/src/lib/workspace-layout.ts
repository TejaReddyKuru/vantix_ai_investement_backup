export type NavigationMode = "expanded" | "rail" | "hidden";
export const parseNavigationMode = (value: unknown): NavigationMode =>
  value === "expanded" || value === "hidden" ? value : "rail";

export type DockTab = "account" | "alerts" | "agents";
export type RailTab = "order" | "book" | "watchlist";
export type TerminalLayout = {
  railOpen: boolean;
  dockOpen: boolean;
  dockHeight: number;
  dockTab: DockTab;
  railTab: RailTab;
};
export const DEFAULT_TERMINAL_LAYOUT: TerminalLayout = {
  railOpen: true, dockOpen: false, dockHeight: 190,
  dockTab: "account", railTab: "order",
};
export function parseTerminalLayout(value: unknown): TerminalLayout {
  const data = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return {
    railOpen: typeof data.railOpen === "boolean" ? data.railOpen : true,
    dockOpen: typeof data.dockOpen === "boolean" ? data.dockOpen : false,
    dockHeight: typeof data.dockHeight === "number" && Number.isFinite(data.dockHeight)
      ? Math.max(120, Math.min(360, data.dockHeight)) : 190,
    dockTab: data.dockTab === "alerts" || data.dockTab === "agents" ? data.dockTab : "account",
    railTab: data.railTab === "book" || data.railTab === "watchlist" ? data.railTab : "order",
  };
}

/** Budget the existing SVG into its measured container; never grow the page for studies. */
export function chartGeometry(available: number, paneCount: number, volume: boolean) {
  const height = Number.isFinite(available) ? Math.max(100, Math.floor(available)) : 360;
  const top = 20, axis = 26;
  const usable = height - top - axis;
  const capacity = Math.max(1, Math.min(3, Math.floor((usable - 180) / 95)));
  const visibleCount = Math.min(Math.max(0, paneCount), capacity);
  const volumeHeight = volume ? Math.min(54, usable * .15) : 0;
  const paneHeight = visibleCount ? Math.min(108, (usable - volumeHeight) * .42 / visibleCount) : 0;
  const chartHeight = usable - volumeHeight - paneHeight * visibleCount;
  return { height, top, capacity, volumeHeight, paneHeight, chartHeight };
}
