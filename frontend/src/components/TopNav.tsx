"use client"

import { Bell, ChevronDown, Search } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { useRouter } from "next/navigation"

export default function TopNav() {
  const { user, logout } = useAuth()
  const router = useRouter()

  return (
    <header className="flex h-[76px] shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-5 sm:px-7">
      <div className="flex min-w-0 items-center gap-3">
        <div className="lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--primary)] text-xs font-extrabold text-white">
            VC
          </div>
        </div>

        <div className="hidden md:flex h-10 w-[280px] items-center gap-2 rounded-xl border border-[var(--border)] bg-[#FAFAF7] px-3 text-[var(--muted)]">
          <Search size={17} />
          <span className="text-sm">Search markets...</span>
          <span className="ml-auto rounded-md border border-[var(--border)] bg-white px-1.5 py-0.5 text-[10px] font-bold">
            /
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--muted)] transition hover:bg-[#FAFAF7]"
          aria-label="Notifications"
        >
          <Bell size={18} />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[var(--positive)]" />
        </button>

        <div className="hidden h-7 w-px bg-[var(--border)] sm:block" />

        <button className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-[#FAFAF7]">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-mint-strong)] text-sm font-bold">
            {(user?.email?.[0] || "V").toUpperCase()}
          </div>

          <div className="hidden text-left sm:block">
            <div className="max-w-[150px] truncate text-xs font-bold">
              {user?.email || "Investor"}
            </div>
            <div className="text-[10px] text-[var(--muted)]">
              Vish Capitals
            </div>
          </div>

          <ChevronDown size={15} className="text-[var(--muted)]" />
        </button>

        <button
          onClick={() => {
            logout()
            router.replace("/login")
          }}
          className="hidden text-xs font-semibold text-[var(--muted)] transition hover:text-[var(--negative)] xl:block"
        >
          Logout
        </button>
      </div>
    </header>
  )
}
