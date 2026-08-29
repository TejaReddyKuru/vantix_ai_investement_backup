"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowUpRight,
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Search,
  Settings,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAssetDirectory } from "@/hooks/useAssetDirectory";
import { MARKET_CATEGORIES } from "@/lib/asset-directory";
import CoinIcon from "@/components/market/CoinIcon";
import { ThemeControl } from "@/context/ThemeContext";

const destinations = [
  { title: "Overview", href: "/dashboard" },
  { title: "Trading Workstation", href: "/paper-trading" },
  { title: "Markets", href: "/markets" },
  { title: "Portfolio", href: "/portfolio" },
  { title: "AI Intelligence", href: "/intelligence" },
  { title: "Community", href: "/community" },
  { title: "Risk Management", href: "/risk" },
  { title: "Journal", href: "/journal" },
  { title: "Settings", href: "/settings" },
];
export default function TopBar({
  onMenuClick,
  ahnaOpen,
  onAhnaToggle,
  onNotificationsOpen,
  notificationsOpen,
}: {
  onMenuClick: () => void;
  ahnaOpen: boolean;
  onAhnaToggle: () => void;
  onNotificationsOpen: () => void;
  notificationsOpen: boolean;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const account = useRef<HTMLDetailsElement>(null);
  const { user, logout } = useAuth();
  const pathname = usePathname(),
    router = useRouter();
  const title =
    destinations.find((item) => item.href === pathname)?.title ?? "Workspace";
  const name =
    mounted && user ? user.display_name || user.email.split("@")[0] : "Account";
  const directory = useAssetDirectory(query, searchOpen);
  const assets = directory.assets;
  const categories = MARKET_CATEGORIES.filter(item => item.key !== "all" && (!query.trim() || `${item.label} ${item.key}`.toLowerCase().includes(query.trim().toLowerCase())));
  const pages = destinations.filter(
    (item) =>
      query.trim() &&
      item.title.toLowerCase().includes(query.trim().toLowerCase()),
  );
  useEffect(() => {
    setMounted(true);
    function keyboard(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing = target?.closest(
        "input, textarea, select, [contenteditable='true']",
      );
      if (
        ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") ||
        (event.key === "/" &&
          !typing &&
          !event.ctrlKey &&
          !event.metaKey &&
          !event.altKey)
      ) {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === "Escape" && account.current?.open) {
        account.current.open = false;
        account.current.querySelector("summary")?.focus();
      }
    }
    function outside(event: PointerEvent) {
      if (account.current && !account.current.contains(event.target as Node))
        account.current.open = false;
    }
    window.addEventListener("keydown", keyboard);
    document.addEventListener("pointerdown", outside);
    return () => {
      window.removeEventListener("keydown", keyboard);
      document.removeEventListener("pointerdown", outside);
    };
  }, []);
  function submit(event: FormEvent) {
    event.preventDefault();
    if (query.trim()) {
      setSearchOpen(false);
      router.push(`/markets?search=${encodeURIComponent(query.trim())}`);
    }
  }
  async function signOut() {
    setSigningOut(true);
    try {
      await logout();
      router.replace("/login");
    } finally {
      setSigningOut(false);
    }
  }
  return (
    <Dialog.Root
      open={searchOpen}
      onOpenChange={(open) => {
        setSearchOpen(open);
        if (!open) setQuery("");
      }}
    >
      <header className="cc-topbar">
        <div className="cc-topbar-title">
          <button
            className="cc-icon-button cc-mobile-menu"
            type="button"
            aria-label="Open navigation"
            onClick={onMenuClick}
          >
            <Menu size={20} />
          </button>
          <span className="cc-breadcrumb">
            Workspace <span aria-hidden="true">/</span> <strong>{title}</strong>
          </span>
        </div>
        <Dialog.Trigger asChild>
          <button
            type="button"
            className="cc-search-trigger"
            aria-label="Search markets and pages"
          >
            <Search size={17} aria-hidden="true" />
            <span>Search markets or pages</span>
            <kbd>
              {mounted && /Mac|iPhone|iPad/.test(navigator.platform)
                ? "⌘ K"
                : "Ctrl K"}
            </kbd>
          </button>
        </Dialog.Trigger>
        <div className="cc-topbar-actions">
          <ThemeControl />
          <button
            type="button"
            className={`cc-button cc-ahna-button ${ahnaOpen ? "is-active" : ""}`}
            aria-expanded={ahnaOpen}
            aria-controls="cc-ahna-panel"
            onClick={onAhnaToggle}
          >
            <Sparkles size={16} aria-hidden="true" />
            <span>AHNA</span>
          </button>
          <button
            id="cc-notifications-trigger"
            type="button"
            className="cc-icon-button"
            aria-label="Open notifications"
            aria-expanded={notificationsOpen}
            onClick={onNotificationsOpen}
          >
            <Bell size={18} />
          </button>
          {mounted && user ? (
            <details ref={account} className="cc-account">
              <summary aria-label="Open account menu">
                <span className="cc-avatar">
                  {name.slice(0, 2).toUpperCase()}
                </span>
                <ChevronDown size={13} aria-hidden="true" />
              </summary>
              <div className="cc-account-panel">
                <strong>{name}</strong>
                <span className="cc-muted cc-account-email">{user.email}</span>
                <Link href="/settings">
                  <Settings size={16} aria-hidden="true" />
                  Account settings
                </Link>
                <button type="button" onClick={signOut} disabled={signingOut}>
                  <LogOut size={16} aria-hidden="true" />
                  {signingOut ? "Signing out…" : "Sign out"}
                </button>
              </div>
            </details>
          ) : (
            <Link href="/login" className="cc-icon-button" aria-label="Sign in">
              <UserRound size={18} />
            </Link>
          )}
        </div>
      </header>
      <Dialog.Portal>
        <Dialog.Overlay className="cc-modal-backdrop" />
        <Dialog.Content
          className="cc-dialog cc-search-modal"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            input.current?.focus();
          }}
        >
          <Dialog.Title className="cc-sr-only">Search CoinCrest</Dialog.Title>
          <Dialog.Description className="cc-sr-only">
            Find an asset or workspace page. Use Tab to select a result.
          </Dialog.Description>
          <form className="cc-search-form" onSubmit={submit}>
            <Search size={20} aria-hidden="true" />
            <input
              ref={input}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search markets and workspace pages"
              placeholder="Search Bitcoin, Community, Portfolio…"
              autoComplete="off"
            />
            <Dialog.Close className="cc-icon-button" aria-label="Close search">
              <X size={18} />
            </Dialog.Close>
          </form>
          <div className="cc-search-results">
            {directory.searching && <p className="cc-search-status" role="status">Searching the wider coin directory…</p>}
            {directory.isError && <p className="cc-data-warning" role="status">Directory search unavailable. Any suggestions below are names only, not live quotes.</p>}
            {categories.length > 0 && <><span className="cc-eyebrow">Categories</span><div className="cc-search-categories">{categories.map(item => <Link key={item.key} href={`/markets?category=${item.key}`} onClick={() => setSearchOpen(false)}>{item.label}<ArrowUpRight size={13}/></Link>)}</div></>}
            {pages.length > 0 && (
              <>
                <span className="cc-eyebrow">Workspace pages</span>
                {pages.map((page) => (
                  <Link
                    key={page.href}
                    href={page.href}
                    onClick={() => setSearchOpen(false)}
                  >
                    {page.title}
                    <ArrowUpRight size={16} />
                  </Link>
                ))}
              </>
            )}
            {assets.length > 0 && (
              <>
                <span className="cc-eyebrow">Assets</span>
                {assets.slice(0, 20).map((asset) => (
                  <Link
                    key={asset.id}
                    href={`/markets?coin=${encodeURIComponent(asset.id)}`}
                    onClick={() => setSearchOpen(false)}
                  >
                    <CoinIcon symbol={asset.symbol} image={asset.image} size={28} />
                    <span>
                      <strong>{asset.name}</strong>
                      <small>{asset.symbol} · {asset.id}</small>
                    </span>
                    <ArrowUpRight size={16} />
                  </Link>
                ))}
              </>
            )}
            {!assets.length && !pages.length && !categories.length && !directory.searching && (
              <div className="cc-empty">
                <h3>No matching results</h3>
                <p>Try an asset name, symbol, or workspace page.</p>
              </div>
            )}
          </div>
          <div className="cc-search-footer">
            {directory.metadataOnly ? "Suggested names · " : "CoinGecko directory · "}quotes appear on Markets. Press Enter to see all matches.
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
