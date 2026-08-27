"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  Bell,
  BookOpen,
  BrainCircuit,
  CircleHelp,
  LayoutDashboard,
  LineChart,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  WalletCards,
  X,
} from "lucide-react"

type SidebarProps = {
  open: boolean
  onClose: () => void
}

const navigation = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Markets",
    href: "/markets",
    icon: LineChart,
  },
  {
    label: "Portfolio",
    href: "/portfolio",
    icon: WalletCards,
  },
  {
    label: "Paper Trading",
    href: "/paper-trading",
    icon: BarChart3,
  },
  {
    label: "AI Intelligence",
    href: "/intelligence",
    icon: BrainCircuit,
  },
  {
    label: "Risk Management",
    href: "/risk",
    icon: ShieldCheck,
  },
]

const secondaryNavigation = [
  {
    label: "Journal",
    href: "/journal",
    icon: BookOpen,
  },
  {
    label: "Alerts",
    href: "/alerts",
    icon: Bell,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
  {
    label: "Community",
    href: "/community",
    icon: Users,
  },
]

export default function Sidebar({
  open,
  onClose,
}: SidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard"
    }

    return pathname === href || pathname.startsWith(`${href}/`)
  }

  const renderNavigationItem = (
    item: (typeof navigation)[number],
  ) => {
    const Icon = item.icon
    const active = isActive(item.href)

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onClose}
        aria-current={active ? "page" : undefined}
        className={[
          "group relative flex items-center gap-3 rounded-xl px-3 py-2.5",
          "text-[13px] font-semibold",
          "transition-all duration-200 ease-out",
          "focus-visible:outline-none focus-visible:ring-2",
          "focus-visible:ring-[#0F2D1F]/30",
          active
            ? [
                "bg-[#0F2D1F]",
                "text-[#F4F3EE]",
                "shadow-[0_8px_24px_rgba(15,45,31,0.16)]",
                "ring-1 ring-[#0F2D1F]/20",
              ].join(" ")
            : [
                "text-[#34342F]",
                "hover:bg-white/80",
                "hover:text-[#0F2D1F]",
                "hover:translate-x-[2px]",
              ].join(" "),
        ].join(" ")}
      >
        {/* Active indicator */}
        {active && (
          <span
            aria-hidden="true"
            className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-[#D8E9DD]"
          />
        )}

        <span
          className={[
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            "transition-all duration-200",
            active
              ? "bg-white/10 text-[#F4F3EE]"
              : "bg-transparent text-[#77776F] group-hover:bg-[#E8F2EA] group-hover:text-[#0F2D1F]",
          ].join(" ")}
        >
          <Icon
            size={17}
            strokeWidth={active ? 2.2 : 1.8}
          />
        </span>

        <span className="truncate">
          {item.label}
        </span>

        {item.label === "AI Intelligence" && (
          <span
            className={[
              "ml-auto rounded-full px-1.5 py-0.5",
              "text-[8px] font-extrabold uppercase tracking-[0.08em]",
              "transition-colors duration-200",
              active
                ? "bg-white/10 text-[#D8E9DD]"
                : "bg-[#E5F1E8] text-[#18794E]",
            ].join(" ")}
          >
            AI
          </span>
        )}

        {active && item.label !== "AI Intelligence" && (
          <span
            aria-hidden="true"
            className="ml-auto h-1.5 w-1.5 rounded-full bg-[#D8E9DD]"
          />
        )}
      </Link>
    )
  }

  const renderSecondaryItem = (
    item: (typeof secondaryNavigation)[number],
  ) => {
    const Icon = item.icon
    const active = isActive(item.href)

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onClose}
        aria-current={active ? "page" : undefined}
        className={[
          "group relative flex items-center gap-3 rounded-xl px-3 py-2.5",
          "text-[13px] font-semibold",
          "transition-all duration-200 ease-out",
          "focus-visible:outline-none focus-visible:ring-2",
          "focus-visible:ring-[#0F2D1F]/30",
          active
            ? [
                "bg-[#0F2D1F]",
                "text-[#F4F3EE]",
                "shadow-[0_8px_22px_rgba(15,45,31,0.14)]",
              ].join(" ")
            : [
                "text-[#34342F]",
                "hover:bg-white/80",
                "hover:text-[#0F2D1F]",
                "hover:translate-x-[2px]",
              ].join(" "),
        ].join(" ")}
      >
        {active && (
          <span
            aria-hidden="true"
            className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-[#D8E9DD]"
          />
        )}

        <span
          className={[
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            "transition-all duration-200",
            active
              ? "bg-white/10 text-[#F4F3EE]"
              : "bg-transparent text-[#55554F] group-hover:bg-[#E8F2EA] group-hover:text-[#0F2D1F]",
          ].join(" ")}
        >
          <Icon
            size={17}
            strokeWidth={active ? 2.1 : 1.8}
          />
        </span>

        <span className="truncate">
          {item.label}
        </span>

        {active && (
          <span
            aria-hidden="true"
            className="ml-auto h-1.5 w-1.5 rounded-full bg-[#D8E9DD]"
          />
        )}
      </Link>
    )
  }

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-[#0F2D1F]/20 backdrop-blur-[3px] lg:hidden"
        />
      )}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-[258px] flex-col",
          "border-r border-[#DDDCD0]",
          "bg-[#F7F6E8]",
          "shadow-[10px_0_40px_rgba(15,45,31,0.035)]",
          "transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0",
        ].join(" ")}
      >
        {/* =========================================================
            BRAND
        ========================================================= */}
        <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-[#E2E1D5] px-5">
          <Link
            href="/dashboard"
            onClick={onClose}
            className="group flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F2D1F]/30"
          >
            <div
              className={[
                "flex h-10 w-10 items-center justify-center",
                "rounded-[13px]",
                "bg-[#0F2D1F]",
                "text-sm font-extrabold text-white",
                "shadow-[0_8px_24px_rgba(15,45,31,0.16)]",
                "transition-all duration-200",
                "group-hover:-translate-y-0.5",
                "group-hover:shadow-[0_12px_28px_rgba(15,45,31,0.22)]",
              ].join(" ")}
            >
              VC
            </div>

            <div>
              <div className="text-[15px] font-extrabold tracking-[-0.025em] text-[#171717]">
                Vish Capitals
              </div>

              <div className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.15em] text-[#8A897F]">
                Intelligence Platform
              </div>
            </div>
          </Link>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="rounded-lg p-1.5 text-[#8A897F] transition-all duration-200 hover:bg-white hover:text-[#0F2D1F] lg:hidden"
          >
            <X size={17} />
          </button>
        </div>

        {/* =========================================================
            NAVIGATION
        ========================================================= */}
        <div className="flex-1 overflow-y-auto px-3 py-5">
          {/* Workspace */}
          <div className="mb-3 px-3 text-[9px] font-extrabold uppercase tracking-[0.18em] text-[#77776F]">
            Workspace
          </div>

          <nav
            aria-label="Workspace navigation"
            className="space-y-1"
          >
            {navigation.map(renderNavigationItem)}
          </nav>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3 px-3">
            <div className="h-px flex-1 bg-[#E2E1D5]" />
            <span className="text-[8px] font-bold uppercase tracking-[0.16em] text-[#B0AFA5]">
              Manage
            </span>
            <div className="h-px flex-1 bg-[#E2E1D5]" />
          </div>

          {/* Manage */}
          <nav
            aria-label="Management navigation"
            className="space-y-1"
          >
            {secondaryNavigation.map(renderSecondaryItem)}
          </nav>
        </div>

        {/* =========================================================
            FRIDAY AI CARD
        ========================================================= */}
        <div className="shrink-0 border-t border-[#E2E1D5] p-3">
          <div
            className={[
              "relative overflow-hidden rounded-2xl",
              "border border-[#D5E2D8]",
              "bg-white",
              "p-4",
              "shadow-[0_10px_30px_rgba(23,23,23,0.045)]",
            ].join(" ")}
          >
            {/* Ambient decoration */}
            <div
              aria-hidden="true"
              className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-[#E8F2EA] blur-2xl"
            />

            <div className="relative">
              <div className="flex items-center gap-2.5">
                <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-[#0F2D1F] text-white shadow-[0_6px_18px_rgba(15,45,31,0.14)]">
                  <Sparkles size={14} />

                  <span
                    aria-hidden="true"
                    className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-[#18794E] ring-2 ring-white"
                  >
                    <span className="absolute inset-0 animate-ping rounded-full bg-[#18794E] opacity-50" />
                  </span>
                </div>

                <div className="min-w-0">
                  <div className="text-xs font-extrabold tracking-[-0.01em] text-[#171717]">
                    Friday AI
                  </div>

                  <div className="mt-0.5 flex items-center gap-1.5 text-[9px] font-semibold text-[#18794E]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#18794E]" />
                    Intelligence online
                  </div>
                </div>

                <span className="ml-auto rounded-full bg-[#E8F2EA] px-1.5 py-1 text-[8px] font-extrabold uppercase tracking-wide text-[#18794E]">
                  Live
                </span>
              </div>

              {/* Score */}
              <div className="mt-4 rounded-xl bg-[#F7F6E8] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#8A897F]">
                    AI Score
                  </span>

                  <span className="text-sm font-extrabold tracking-[-0.02em] text-[#0F2D1F]">
                    87
                    <span className="text-[9px] font-semibold text-[#9A998F]">
                      /100
                    </span>
                  </span>
                </div>

                <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[#E3E5D9]">
                  <div className="h-full w-[87%] rounded-full bg-[#0F2D1F]" />
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[8px] font-semibold text-[#9A998F]">
                    Market confidence
                  </span>

                  <span className="text-[8px] font-extrabold text-[#18794E]">
                    Strong
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Help */}
          <Link
            href="/help"
            onClick={onClose}
            className="mt-3 flex items-center justify-center gap-2 rounded-lg py-1.5 text-[10px] font-semibold text-[#8A897F] transition-all duration-200 hover:bg-white/60 hover:text-[#0F2D1F]"
          >
            <CircleHelp size={13} />
            Help & Support
          </Link>
        </div>
      </aside>
    </>
  )
}
