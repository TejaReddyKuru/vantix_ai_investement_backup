"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  ChartCandlestick,
  LayoutDashboard,
  Settings,
  Sparkles,
  Users,
  WalletCards,
} from "lucide-react"

const items = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/markets",
    label: "Markets",
    icon: BarChart3,
  },
  {
    href: "/terminal",
    label: "Trading Terminal",
    icon: ChartCandlestick,
  },
  {
    href: "/portfolio",
    label: "Portfolio",
    icon: BriefcaseBusiness,
  },
  {
    href: "/paper",
    label: "Paper Trading",
    icon: WalletCards,
  },
  {
    href: "/alerts",
    label: "Alerts",
    icon: Bell,
  },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden w-[240px] shrink-0 border-r border-[var(--border)] bg-[var(--surface)] lg:flex lg:flex-col">
      <div className="flex h-[76px] items-center border-b border-[var(--border)] px-6">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)] text-sm font-extrabold text-white">
            VC
          </div>

          <div>
            <div className="text-[15px] font-extrabold tracking-tight">
              Vish Capitals
            </div>
            <div className="text-[11px] font-medium text-[var(--muted)]">
              AI Trading Platform
            </div>
          </div>
        </Link>
      </div>

      <div className="flex-1 px-3 py-5">
        <div className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
          Workspace
        </div>

        <nav className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" &&
                pathname.startsWith(`${item.href}/`))

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                  active
                    ? "bg-[var(--surface-mint)] text-[var(--primary)]"
                    : "text-[var(--muted)] hover:bg-[#F7F7F2] hover:text-[var(--foreground)]",
                ].join(" ")}
              >
                <Icon size={18} strokeWidth={active ? 2.4 : 2} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="my-6 border-t border-[var(--border)]" />

        <div className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
          Intelligence
        </div>

        <Link
          href="/ai"
          className={[
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
            pathname.startsWith("/ai")
              ? "bg-[var(--surface-mint)] text-[var(--primary)]"
              : "text-[var(--muted)] hover:bg-[#F7F7F2] hover:text-[var(--foreground)]",
          ].join(" ")}
        >
          <Sparkles size={18} />
          <span>Friday AI</span>
        </Link>
      </div>

      <div className="border-t border-[var(--border)] p-3 space-y-1">
        <Link
          href="/settings"
          className={[
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
            pathname.startsWith("/settings")
              ? "bg-[var(--surface-mint)] text-[var(--primary)]"
              : "text-[var(--muted)] hover:bg-[#F7F7F2] hover:text-[var(--foreground)]",
          ].join(" ")}
        >
          <Settings size={18} />
          <span>Settings</span>
        </Link>
        <Link
          href="/community"
          className={[
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
            pathname.startsWith("/community")
              ? "bg-[var(--surface-mint)] text-[var(--primary)]"
              : "text-[var(--muted)] hover:bg-[#F7F7F2] hover:text-[var(--foreground)]",
          ].join(" ")}
        >
          <Users size={18} />
          <span>Community</span>
        </Link>
      </div>
    </aside>
  )
}
