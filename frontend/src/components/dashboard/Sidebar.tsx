"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import {
  BookOpen,
  BrainCircuit,
  CandlestickChart,
  LayoutDashboard,
  LineChart,
  MessageSquare,
  Settings,
  ShieldCheck,
  Sparkles,
  WalletCards,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import CoinCrestBrand, { CoinCrestMark } from "@/components/branding/CoinCrestBrand";
import { useWorkspace } from "./WorkspaceContext";

const navigation = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Markets", href: "/markets", icon: LineChart },
  {
    label: "Trading",
    href: "/paper-trading",
    icon: CandlestickChart,
  },
  { label: "Portfolio", href: "/portfolio", icon: WalletCards },
  { label: "Intelligence", href: "/intelligence", icon: BrainCircuit },
  { label: "Risk", href: "/risk", icon: ShieldCheck },
  { label: "Community", href: "/community", icon: MessageSquare },
];
const management = [
  { label: "Journal", href: "/journal", icon: BookOpen },
  { label: "Settings", href: "/settings", icon: Settings },
];
export default function Sidebar({
  open,
  onClose,
  onCollapse,
  collapsed = false,
}: {
  open: boolean;
  onClose: () => void;
  onCollapse?: () => void;
  collapsed?: boolean;
}) {
  const pathname = usePathname();
  const { openAhna } = useWorkspace();
  const content = (
    <>
      <div className="cc-brand-row">
        <Link href="/dashboard" className="cc-brand" aria-label="CoinCrest overview" onClick={onClose}>
          <span className="cc-full-brand"><CoinCrestBrand compact /></span>
          <span className="cc-rail-brand"><CoinCrestMark className="h-8 w-8" /></span>
        </Link>
      </div>
      <button
        type="button"
        className="cc-sidebar-edge-toggle"
        aria-label={collapsed ? "Expand workspace navigation" : "Collapse workspace navigation"}
        title={collapsed ? "Expand navigation" : "Collapse navigation"}
        aria-expanded={!collapsed}
        aria-controls="workspace-sidebar"
        onClick={onCollapse}
      >
        {collapsed ? <ChevronRight size={14} strokeWidth={2.2} /> : <ChevronLeft size={14} strokeWidth={2.2} />}
      </button>
      <div className="cc-nav-body">
        <span className="cc-eyebrow cc-nav-label">Workspace</span>
        <nav aria-label="Workspace navigation">
          {navigation.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              aria-current={
                pathname === href || pathname.startsWith(href + "/")
                  ? "page"
                  : undefined
              }
              className="cc-nav-link"
              title={label}
              aria-label={label}
            >
              <Icon size={18} strokeWidth={1.7} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="cc-nav-divider" />
        <span className="cc-eyebrow cc-nav-label">Manage</span>
        <nav aria-label="Account navigation">
          {management.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              aria-current={pathname === href ? "page" : undefined}
              className="cc-nav-link"
              title={label}
              aria-label={label}
            >
              <Icon size={18} strokeWidth={1.7} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
      </div>
      <div className="cc-sidebar-bottom">
        <button
          type="button"
          className="cc-ahna-launch"
          aria-label="Open AHNA market copilot"
          title="Open AHNA"
          onClick={() => {
            onClose();
            openAhna();
          }}
        >
          <span className="cc-ahna-symbol">
            <Sparkles size={19} aria-hidden="true" />
          </span>
          <span>
            <strong>Meet AHNA</strong>
            <small>Your market copilot</small>
          </span>
          <span aria-hidden="true">↗</span>
        </button>
      </div>
    </>
  );
  return (
    <>
      <aside id="workspace-sidebar" className="cc-sidebar cc-sidebar-desktop">{content}</aside>
      <Dialog.Root
        open={open}
        onOpenChange={(value) => {
          if (!value) onClose();
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="cc-mobile-backdrop" />
          <Dialog.Content className="cc-sidebar cc-sidebar-mobile cc-dialog">
            <Dialog.Title className="cc-sr-only">
              CoinCrest navigation
            </Dialog.Title>
            <Dialog.Description className="cc-sr-only">
              Choose a workspace page.
            </Dialog.Description>
            <Dialog.Close
              className="cc-icon-button cc-sidebar-close"
              aria-label="Close navigation"
            >
              <X size={18} />
            </Dialog.Close>
            {content}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
