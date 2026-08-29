"use client";

import { createContext, useContext } from "react";

export type WorkspaceActions = {
  openAhna: () => void;
  openNotifications: () => void;
  activeSymbol: string;
  activeCoinId: string | null;
  selectAsset: (symbol: string, coinId: string) => void;
  setActiveSymbol: (symbol: string) => void;
};
export const WorkspaceContext = createContext<WorkspaceActions | null>(null);
export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error("Workspace controls require DashboardShell");
  return context;
}
