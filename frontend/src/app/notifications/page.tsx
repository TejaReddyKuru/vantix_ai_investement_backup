"use client"

import {
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  BrainCircuit,
  Check,
  ChevronRight,
  Clock3,
  ShieldCheck,
  Settings,
  Sparkles,
  Trash2,
  Wallet,
} from "lucide-react"
import { useState } from "react"

type Notification = {
  id: number
  title: string
  description: string
  time: string
  category: string
  unread: boolean
  type: "trade" | "ai" | "risk" | "portfolio" | "system"
}

const initialNotifications: Notification[] = [
  {
    id: 1,
    title: "BTC resistance alert",
    description:
      "Bitcoin is approaching a major resistance zone. Friday recommends monitoring volatility before increasing exposure.",
    time: "12 min ago",
    category: "Trading",
    unread: true,
    type: "trade",
  },
  {
    id: 2,
    title: "Friday market intelligence",
    description:
      "Large-cap crypto momentum remains constructive with BTC continuing to lead the market.",
    time: "34 min ago",
    category: "Friday AI",
    unread: true,
    type: "ai",
  },
  {
    id: 3,
    title: "Risk assessment completed",
    description:
      "Your current portfolio remains within the configured risk limits.",
    time: "1 hr ago",
    category: "Risk",
    unread: true,
    type: "risk",
  },
  {
    id: 4,
    title: "BTC position increased",
    description:
      "Your paper portfolio position was increased by 0.025 BTC.",
    time: "2 hrs ago",
    category: "Portfolio",
    unread: false,
    type: "portfolio",
  },
  {
    id: 5,
    title: "Portfolio performance update",
    description:
      "Your portfolio is currently showing a positive return over the selected period.",
    time: "4 hrs ago",
    category: "Portfolio",
    unread: false,
    type: "portfolio",
  },
  {
    id: 6,
    title: "Security reminder",
    description:
      "Review your account security settings and make sure your session preferences are configured.",
    time: "Yesterday",
    category: "System",
    unread: false,
    type: "system",
  },
]

function NotificationIcon({ type }: { type: Notification["type"] }) {
  const common = "h-4 w-4"

  if (type === "trade") {
    return <ArrowUpRight className={common} />
  }

  if (type === "ai") {
    return <Sparkles className={common} />
  }

  if (type === "risk") {
    return <ShieldCheck className={common} />
  }

  if (type === "portfolio") {
    return <Wallet className={common} />
  }

  return <Bell className={common} />
}

function iconBackground(type: Notification["type"]) {
  if (type === "trade") return "bg-[#E8F2EA] text-[#18794E]"
  if (type === "ai") return "bg-[#EDE9F8] text-[#67538F]"
  if (type === "risk") return "bg-[#EAF1ED] text-[#0F2D1F]"
  if (type === "portfolio") return "bg-[#F3F0E5] text-[#806F42]"
  return "bg-[#F1F1E9] text-[#64645D]"
}

export default function NotificationsPage() {
  const [notifications, setNotifications] =
    useState(initialNotifications)

  const [filter, setFilter] = useState("All")

  const unreadCount = notifications.filter(
    (notification) => notification.unread,
  ).length

  const filteredNotifications =
    filter === "Unread"
      ? notifications.filter((notification) => notification.unread)
      : notifications

  function markAsRead(id: number) {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id
          ? { ...notification, unread: false }
          : notification,
      ),
    )
  }

  function markAllAsRead() {
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        unread: false,
      })),
    )
  }

  function clearAll() {
    setNotifications([])
  }

  return (
    <main className="min-h-screen bg-[#F7F6E8] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <section className="mb-6 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-[0.18em] text-[#8A897F]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#18794E]" />
              Activity center
            </div>

            <h1 className="text-3xl font-extrabold tracking-[-0.045em] text-[#171717]">
              Notifications
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-[#77776F]">
              Stay updated on your portfolio, market movements, Friday
              intelligence and account activity.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={markAllAsRead}
              className="flex items-center gap-2 rounded-xl border border-[#DDE3DD] bg-white px-4 py-2.5 text-xs font-bold text-[#34342F] transition hover:border-[#BFD3C5]"
            >
              <Check size={14} />
              Mark all read
            </button>

            <button
              type="button"
              onClick={clearAll}
              className="flex items-center gap-2 rounded-xl border border-[#E4E2D8] bg-white px-4 py-2.5 text-xs font-bold text-[#77776F] transition hover:border-[#D5CFC1] hover:text-[#34342F]"
            >
              <Trash2 size={14} />
              Clear
            </button>
          </div>
        </section>

        {/* Summary */}
        <section className="mb-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#E1E2D8] bg-white p-5">
            <div className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-[#9A998F]">
              Total notifications
            </div>
            <div className="mt-2 text-2xl font-extrabold text-[#171717]">
              {notifications.length}
            </div>
          </div>

          <div className="rounded-2xl border border-[#DCE7DE] bg-[#E8F2EA] p-5">
            <div className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-[#718178]">
              Unread
            </div>
            <div className="mt-2 text-2xl font-extrabold text-[#0F2D1F]">
              {unreadCount}
            </div>
          </div>

          <div className="rounded-2xl border border-[#E1E2D8] bg-white p-5">
            <div className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-[#9A998F]">
              AI alerts
            </div>
            <div className="mt-2 text-2xl font-extrabold text-[#171717]">
              {notifications.filter((n) => n.type === "ai").length}
            </div>
          </div>
        </section>

        {/* Notification card */}
        <section className="overflow-hidden rounded-2xl border border-[#E1E2D8] bg-white shadow-[0_8px_30px_rgba(23,23,23,0.025)]">

          {/* Filters */}
          <div className="flex flex-col justify-between gap-3 border-b border-[#ECECE4] p-4 sm:flex-row sm:items-center">
            <div className="flex gap-1 rounded-lg bg-[#F5F5EF] p-1">
              {["All", "Unread"].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFilter(item)}
                  className={[
                    "rounded-md px-3 py-1.5 text-[10px] font-extrabold transition",
                    filter === item
                      ? "bg-white text-[#0F2D1F] shadow-sm"
                      : "text-[#9A998F] hover:text-[#34342F]",
                  ].join(" ")}
                >
                  {item}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                (window.location.href = "/settings")
              }
              className="flex items-center gap-1.5 text-[10px] font-extrabold text-[#0F2D1F]"
            >
              <Settings size={13} />
              Notification settings
              <ChevronRight size={13} />
            </button>
          </div>

          {/* List */}
          <div className="divide-y divide-[#F0F0EA]">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8F2EA] text-[#0F2D1F]">
                  <Bell size={20} />
                </div>

                <h2 className="mt-4 text-sm font-extrabold text-[#34342F]">
                  You&apos;re all caught up
                </h2>

                <p className="mt-1 max-w-sm text-xs leading-5 text-[#9A998F]">
                  There are no unread notifications right now.
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <article
                  key={notification.id}
                  className={[
                    "group flex gap-4 p-5 transition-colors",
                    notification.unread
                      ? "bg-[#FBFCF9]"
                      : "bg-white",
                    "hover:bg-[#FAFAF7]",
                  ].join(" ")}
                >
                  <div
                    className={[
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                      iconBackground(notification.type),
                    ].join(" ")}
                  >
                    <NotificationIcon type={notification.type} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xs font-extrabold text-[#34342F]">
                        {notification.title}
                      </h3>

                      {notification.unread && (
                        <span className="h-1.5 w-1.5 rounded-full bg-[#18794E]" />
                      )}

                      <span className="rounded-full bg-[#F5F5EF] px-2 py-0.5 text-[8px] font-bold text-[#8A897F]">
                        {notification.category}
                      </span>
                    </div>

                    <p className="mt-1 max-w-3xl text-xs leading-5 text-[#77776F]">
                      {notification.description}
                    </p>

                    <div className="mt-2 flex items-center gap-1.5 text-[9px] font-semibold text-[#AAA99F]">
                      <Clock3 size={10} />
                      {notification.time}
                    </div>
                  </div>

                  {notification.unread && (
                    <button
                      type="button"
                      onClick={() => markAsRead(notification.id)}
                      className="self-center rounded-lg border border-[#DDE3DD] bg-white px-3 py-2 text-[9px] font-extrabold text-[#0F2D1F] opacity-0 transition group-hover:opacity-100 hover:border-[#BFD3C5]"
                    >
                      Mark read
                    </button>
                  )}
                </article>
              ))
            )}
          </div>
        </section>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-center gap-2 text-[9px] font-semibold text-[#A09F96]">
          <BrainCircuit size={11} />
          Vish Capitals Intelligence Platform
        </div>
      </div>
    </main>
  )
}