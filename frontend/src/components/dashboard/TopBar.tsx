"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import {
  Bell,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  Sparkles,
  TrendingUp,
  User,
  X,
} from "lucide-react"

type TopBarProps = {
  onMenuClick: () => void
  fridayOpen: boolean
  onFridayToggle: () => void
}

const marketSuggestions = [
  {
    symbol: "BTC",
    name: "Bitcoin",
    price: "$118,420",
    change: "+2.84%",
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    price: "$4,215",
    change: "+1.92%",
  },
  {
    symbol: "SOL",
    name: "Solana",
    price: "$186.42",
    change: "+4.17%",
  },
  {
    symbol: "BNB",
    name: "BNB",
    price: "$812.35",
    change: "+1.26%",
  },
  {
    symbol: "XRP",
    name: "XRP",
    price: "$3.18",
    change: "+2.11%",
  },
]

export default function TopBar({
  onMenuClick,
  fridayOpen,
  onFridayToggle,
}: TopBarProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [accountOpen, setAccountOpen] = useState(false)

  const searchInputRef = useRef<HTMLInputElement>(null)
  const accountRef = useRef<HTMLDivElement>(null)

  const filteredMarkets = marketSuggestions.filter((market) => {
    const query = searchQuery.trim().toLowerCase()

    if (!query) {
      return true
    }

    return (
      market.symbol.toLowerCase().includes(query) ||
      market.name.toLowerCase().includes(query)
    )
  })

  function openSearch() {
    setSearchOpen(true)
    setAccountOpen(false)

    window.setTimeout(() => {
      searchInputRef.current?.focus()
    }, 50)
  }

  function closeSearch() {
    setSearchOpen(false)
    setSearchQuery("")
  }

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const query = searchQuery.trim()

    if (!query) {
      return
    }

    window.location.href = `/markets?search=${encodeURIComponent(query)}`
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeSearch()
        setAccountOpen(false)
      }

      if (
        event.key === "/" &&
        !searchOpen &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        event.preventDefault()
        openSearch()
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [searchOpen])

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        accountRef.current &&
        !accountRef.current.contains(event.target as Node)
      ) {
        setAccountOpen(false)
      }
    }

    document.addEventListener("mousedown", handleOutsideClick)

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick)
    }
  }, [])

  return (
    <>
      <header className="sticky top-0 z-30 h-16 border-b border-[#D2D2C6] bg-[#F7F6E8]">
        <div className="relative flex h-full items-center px-4 sm:px-6 lg:px-7">

          {/* LEFT — PAGE TITLE */}
          <div className="flex shrink-0 items-center gap-3">

            {/* Mobile menu */}
            <button
              type="button"
              onClick={onMenuClick}
              aria-label="Open navigation"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#BDBDB2] bg-white text-[#292923] shadow-sm transition-all hover:border-[#0F2D1F] hover:bg-[#F1F5F0] hover:text-[#0F2D1F] lg:hidden"
            >
              <Menu size={17} strokeWidth={2.2} />
            </button>

            {/* Page title */}
            <Link
              href="/dashboard"
              className="group"
              aria-label="Go to dashboard"
            >
              <div className="hidden text-[8px] font-extrabold uppercase tracking-[0.18em] text-[#64645D] sm:block">
                Workspace
              </div>

              <div className="text-[14px] font-extrabold tracking-[-0.01em] text-[#171717] transition-colors group-hover:text-[#0F2D1F]">
                Market Overview
              </div>
            </Link>
          </div>

          {/* CENTER — SEARCH */}
          <div className="absolute left-1/2 hidden -translate-x-1/2 sm:block">
            <button
              type="button"
              onClick={openSearch}
              aria-label="Search markets"
              className="flex h-11 w-[360px] items-center gap-3 rounded-xl border-2 border-[#B8B8AC] bg-white px-4 text-left text-[12px] font-semibold text-[#4F4F48] shadow-[0_3px_12px_rgba(23,23,23,0.08)] transition-all duration-200 hover:border-[#0F2D1F] hover:shadow-[0_5px_18px_rgba(15,45,31,0.12)] lg:w-[440px]"
            >
              <Search
                size={18}
                strokeWidth={2.3}
                className="shrink-0 text-[#292923]"
              />

              <span className="flex-1 text-[#4F4F48]">
                Search markets...
              </span>

              <kbd className="hidden rounded-md border border-[#E0E0D6] bg-[#F7F7F1] px-1.5 py-0.5 text-[8px] font-bold text-[#8A897F] lg:block">
                /
              </kbd>
            </button>
          </div>

          {/* MOBILE SEARCH */}
          <button
            type="button"
            onClick={openSearch}
            aria-label="Search markets"
            className="ml-auto mr-2 flex h-10 w-10 items-center justify-center rounded-lg border-2 border-[#BDBDB2] bg-white text-[#292923] shadow-sm transition-all hover:border-[#0F2D1F] hover:bg-[#F1F5F0] hover:text-[#0F2D1F] sm:hidden"
          >
            <Search size={17} strokeWidth={2.3} />
          </button>

          {/* RIGHT — FRIDAY + NOTIFICATIONS + ACCOUNT */}
          <div className="ml-auto flex shrink-0 items-center gap-2">

            {/* Friday AI */}
            <button
              type="button"
              onClick={onFridayToggle}
              aria-label={
                fridayOpen
                  ? "Close Friday AI"
                  : "Open Friday AI"
              }
              aria-pressed={fridayOpen}
              className={[
                "flex h-10 items-center gap-2 rounded-lg border-2 px-3",
                "text-[11px] font-extrabold transition-all duration-200",
                fridayOpen
                  ? "border-[#8FB49B] bg-[#DDEEE2] text-[#0F2D1F] shadow-sm"
                  : "border-[#BDBDB2] bg-white text-[#292923] shadow-sm hover:border-[#0F2D1F] hover:bg-[#F1F5F0] hover:text-[#0F2D1F]",
              ].join(" ")}
            >
              <Sparkles
                size={15}
                strokeWidth={2.3}
              />

              <span className="hidden sm:inline">
                Friday
              </span>

              <span
                className={[
                  "h-1.5 w-1.5 rounded-full",
                  fridayOpen
                    ? "bg-[#18794E]"
                    : "bg-[#64645D]",
                ].join(" ")}
              />
            </button>

            {/* Notifications */}
            <Link
              href="/notifications"
              aria-label="Open notifications"
              className="relative flex h-10 w-10 items-center justify-center rounded-lg border-2 border-[#BDBDB2] bg-white text-[#292923] shadow-sm transition-all hover:border-[#0F2D1F] hover:bg-[#F1F5F0] hover:text-[#0F2D1F]"
            >
              <Bell
                size={16}
                strokeWidth={2.3}
              />

              {/* Unread indicator */}
              <span className="absolute right-2 top-1.5 h-1.5 w-1.5 rounded-full bg-[#18794E] ring-2 ring-white" />
            </Link>

            {/* Account */}
            <div
              ref={accountRef}
              className="relative hidden sm:block"
            >
              <button
                type="button"
                onClick={() => {
                  setAccountOpen((current) => !current)
                  setSearchOpen(false)
                }}
                aria-label="Open user menu"
                aria-expanded={accountOpen}
                className={[
                  "flex h-10 items-center gap-2 rounded-lg border-2 bg-white px-2.5 shadow-sm transition-all",
                  accountOpen
                    ? "border-[#8FB49B] bg-[#F1F5F0]"
                    : "border-[#BDBDB2] hover:border-[#0F2D1F] hover:bg-[#F1F5F0]",
                ].join(" ")}
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0F2D1F] text-[9px] font-extrabold text-white">
                  VS
                </div>

                <div className="hidden text-left lg:block">
                  <div className="text-[9px] font-extrabold leading-none text-[#171717]">
                    Vish
                  </div>

                  <div className="mt-0.5 text-[7px] font-semibold leading-none text-[#64645D]">
                    Pro Account
                  </div>
                </div>

                <ChevronDown
                  size={12}
                  strokeWidth={2.2}
                  className={[
                    "text-[#4F4F48] transition-transform duration-200",
                    accountOpen ? "rotate-180" : "",
                  ].join(" ")}
                />
              </button>

              {/* Account dropdown */}
              {accountOpen && (
                <div className="absolute right-0 top-[calc(100%+10px)] w-64 overflow-hidden rounded-2xl border border-[#D7D8CC] bg-white shadow-[0_20px_50px_rgba(23,23,23,0.14)]">

                  <div className="border-b border-[#ECECE4] bg-[#FAFAF7] p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0F2D1F] text-xs font-extrabold text-white">
                        VS
                      </div>

                      <div>
                        <div className="text-xs font-extrabold text-[#171717]">
                          Vish
                        </div>

                        <div className="mt-1 text-[9px] font-semibold text-[#8A897F]">
                          Pro Account
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-2">

                    <Link
                      href="/dashboard"
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-[#34342F] transition-colors hover:bg-[#F3F5F0] hover:text-[#0F2D1F]"
                    >
                      <LayoutDashboard size={15} />
                      Dashboard
                    </Link>

                    <Link
                      href="/portfolio"
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-[#34342F] transition-colors hover:bg-[#F3F5F0] hover:text-[#0F2D1F]"
                    >
                      <TrendingUp size={15} />
                      Portfolio
                    </Link>

                    <Link
                      href="/settings"
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-[#34342F] transition-colors hover:bg-[#F3F5F0] hover:text-[#0F2D1F]"
                    >
                      <Settings size={15} />
                      Settings
                    </Link>

                    <Link
                      href="/settings"
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-[#34342F] transition-colors hover:bg-[#F3F5F0] hover:text-[#0F2D1F]"
                    >
                      <User size={15} />
                      Account
                    </Link>
                  </div>

                  <div className="border-t border-[#ECECE4] p-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAccountOpen(false)
                        window.dispatchEvent(
                          new Event("logout-request")
                        )
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-[#8A403A] transition-colors hover:bg-[#FFF4F2]"
                    >
                      <LogOut size={15} />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* SEARCH OVERLAY */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-[100] bg-[#0F2D1F]/20 backdrop-blur-[3px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeSearch()
            }
          }}
        >
          <div className="mx-auto mt-20 w-[calc(100%-2rem)] max-w-2xl sm:mt-28">

            <div className="overflow-hidden rounded-2xl border border-[#D8D9CE] bg-white shadow-[0_30px_80px_rgba(15,45,31,0.2)]">

              {/* Search header */}
              <form
                onSubmit={handleSearchSubmit}
                className="flex items-center gap-3 border-b border-[#ECECE4] px-4 py-4"
              >
                <Search
                  size={20}
                  strokeWidth={2.2}
                  className="shrink-0 text-[#0F2D1F]"
                />

                <input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(event) =>
                    setSearchQuery(event.target.value)
                  }
                  placeholder="Search Bitcoin, Ethereum, Solana..."
                  className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#171717] outline-none placeholder:text-[#A09F96]"
                  autoComplete="off"
                />

                <button
                  type="button"
                  onClick={closeSearch}
                  aria-label="Close search"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#77776F] transition-colors hover:bg-[#F3F3EC] hover:text-[#171717]"
                >
                  <X size={17} />
                </button>
              </form>

              {/* Search content */}
              <div className="max-h-[430px] overflow-y-auto p-3">

                <div className="px-3 pb-2 pt-1 text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#9A998F]">
                  {searchQuery
                    ? "Matching markets"
                    : "Popular markets"}
                </div>

                {filteredMarkets.length > 0 ? (
                  <div className="space-y-1">
                    {filteredMarkets.map((market) => (
                      <Link
                        key={market.symbol}
                        href={`/markets?search=${encodeURIComponent(
                          market.symbol
                        )}`}
                        onClick={closeSearch}
                        className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-[#F5F6F1]"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F2EA] text-[10px] font-extrabold text-[#0F2D1F]">
                          {market.symbol.slice(0, 3)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-extrabold text-[#34342F]">
                            {market.name}
                          </div>

                          <div className="mt-0.5 text-[9px] font-semibold text-[#9A998F]">
                            {market.symbol}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-extrabold tabular-nums text-[#34342F]">
                            {market.price}
                          </div>

                          <div className="mt-0.5 text-[9px] font-extrabold text-[#18794E]">
                            {market.change}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-12 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#F3F3EC]">
                      <Search
                        size={20}
                        className="text-[#8A897F]"
                      />
                    </div>

                    <div className="mt-3 text-xs font-extrabold text-[#34342F]">
                      No markets found
                    </div>

                    <p className="mt-1 text-[10px] text-[#9A998F]">
                      Try searching for BTC, ETH, SOL or another asset.
                    </p>
                  </div>
                )}

                <div className="mt-2 border-t border-[#ECECE4] px-3 pt-3">
                  <Link
                    href="/markets"
                    onClick={closeSearch}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#0F2D1F] py-3 text-[10px] font-extrabold text-white transition-colors hover:bg-[#17452F]"
                  >
                    <TrendingUp size={14} />
                    Explore all markets
                  </Link>
                </div>
              </div>
            </div>

            {/* Search shortcuts */}
            <div className="mt-3 flex items-center justify-center gap-4 text-[9px] font-semibold text-[#FFFFFF]/80">
              <span>
                <kbd className="mr-1 rounded border border-white/30 px-1.5 py-0.5">
                  ESC
                </kbd>
                Close
              </span>

              <span>
                <kbd className="mr-1 rounded border border-white/30 px-1.5 py-0.5">
                  ENTER
                </kbd>
                Search
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}