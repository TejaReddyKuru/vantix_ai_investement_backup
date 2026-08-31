"use client"

import { FormEvent, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import axios from "axios"
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react"

import { useAuth } from "../../context/AuthContext"
import AuthShell from "../../components/auth/AuthShell"
import { safeReturnPath } from "@/lib/workspace-navigation"

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(false)
  const [nextPath, setNextPath] = useState("/dashboard")

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const requestedPath = params.get("next")

    setRegistered(params.get("registered") === "true")

    setNextPath(safeReturnPath(requestedPath))
  }, [])

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await login(email.trim().toLowerCase(), password)
      router.replace(nextPath)
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail

        if (Array.isArray(detail)) {
          setError(
            detail
              .map((item) =>
                typeof item === "object" && item !== null && "msg" in item
                  ? String(item.msg)
                  : String(item)
              )
              .join(", ")
          )
        } else if (typeof detail === "string") {
          setError(detail)
        } else {
          setError("We could not verify that email and password.")
        }
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("We could not verify that email and password.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Member access"
      title="Welcome back."
      description="Return to your market workspace, paper portfolio, and AHNA intelligence briefs."
      asideTitle="Trade what you see. Understand what you risk."
      asideDescription="CoinCrest brings fragmented crypto evidence into one deliberate workflow—so your next decision begins with context, not urgency."
    >
      {registered && (
        <div
          role="status"
          className="mb-6 flex gap-3 rounded-xl border border-[#70C891]/35 bg-[#70C891]/12 px-4 py-3.5 text-[14px] leading-6 text-[#155B3B]"
        >
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <span><b>Account created.</b> Sign in to enter your workspace.</span>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mb-6 flex gap-3 rounded-xl border border-[#D6A12A]/35 bg-[#FFEA93]/35 px-4 py-3.5 text-[14px] leading-6 text-[#60460B]"
        >
          <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="mb-2.5 block text-[14px] font-black text-[#07111F]">
            Email address
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#07111F]/40" />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              autoFocus
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="min-h-[56px] w-full rounded-xl border border-[#07111F]/15 bg-[#FFFEFA] py-3 pl-12 pr-4 text-[15px] font-bold !text-[#07111F] outline-none transition placeholder:text-[#07111F]/40 focus:border-[#2F78B7] focus:ring-4 focus:ring-[#2F78B7]/12 shadow-sm"
              style={{ color: "#07111F", caretColor: "#164F7D" }}
            />
          </div>
        </div>

        <div>
          <div className="mb-2.5 flex items-center justify-between gap-3">
            <label htmlFor="password" className="text-[14px] font-black text-[#07111F]">
              Password
            </label>
            <Link href="/forgot-password" className="text-[13px] font-black text-[#164F7D] transition hover:text-[#2F78B7] hover:underline">
              Forgot password?
            </Link>
          </div>

          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#07111F]/40" />
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              className="min-h-[56px] w-full rounded-xl border border-[#07111F]/15 bg-[#FFFEFA] py-3 pl-12 pr-14 text-[15px] font-bold !text-[#07111F] outline-none transition placeholder:text-[#07111F]/40 focus:border-[#2F78B7] focus:ring-4 focus:ring-[#2F78B7]/12 shadow-sm"
              style={{ color: "#07111F", caretColor: "#164F7D" }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-[#07111F]/40 transition hover:bg-[#2F78B7]/8 hover:text-[#164F7D]"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-h-[56px] w-full items-center justify-center gap-2 rounded-md bg-[#164F7D] px-6 text-[15px] font-black text-white shadow-[0_14px_34px_rgba(22,79,125,0.2)] transition hover:-translate-y-0.5 hover:bg-[#103F65] hover:shadow-[0_18px_42px_rgba(22,79,125,0.26)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {loading ? "Signing in…" : "Sign in securely"}
          {!loading && <ArrowRight className="h-4 w-4" />}
        </button>
      </form>

      <div className="mt-5 flex items-center justify-center gap-2 text-[12px] font-bold text-[#07111F]/42">
        <ShieldCheck className="h-4 w-4 text-[#2D8C68]" />
        Your session is created through the existing CoinCrest authentication API.
      </div>

      <div className="mt-7 border-t border-[#07111F]/10 pt-6 text-center text-[14px] text-[#07111F]/55">
        New to CoinCrest?{" "}
        <Link href="/register" className="font-black text-[#164F7D] transition hover:text-[#2F78B7] hover:underline">
          Create your account
        </Link>
      </div>
    </AuthShell>
  )
}
