"use client"

import { FormEvent, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import axios from "axios"
import { useAuth } from "../../context/AuthContext"
import {
  ArrowRight,
  Check,
  CircleAlert,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react"

import { apiClient } from "../../lib/client"
import AuthShell from "../../components/auth/AuthShell"

export default function RegisterPage() {
  const router = useRouter()
  const { token } = useAuth()

  useEffect(() => {
    if (token) {
      router.replace("/dashboard")
    }
  }, [token, router])

  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const passwordChecks = [
    { label: "8+ characters", met: password.length >= 8 },
    { label: "Upper & lower case", met: /[a-z]/.test(password) && /[A-Z]/.test(password) },
    { label: "At least one number", met: /\d/.test(password) },
  ]

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    const cleanDisplayName = displayName.trim()
    const cleanEmail = email.trim().toLowerCase()

    if (!cleanDisplayName) {
      setError("Please enter your full name.")
      return
    }

    if (!cleanEmail) {
      setError("Please enter your email address.")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)

    try {
      await apiClient.post("/api/v1/auth/register", {
        display_name: cleanDisplayName,
        email: cleanEmail,
        password,
      })

      router.push("/login?registered=true")
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status
        const detail = err.response?.data?.detail

        if (Array.isArray(detail)) {
          const messages = detail
            .map((item) =>
              typeof item === "object" && item !== null && "msg" in item
                ? String(item.msg)
                : String(item)
            )
            .filter(Boolean)

          setError(messages.length > 0 ? messages.join(", ") : "Registration failed. Please check your information.")
        } else if (typeof detail === "string") {
          setError(detail)
        } else if (status === 409) {
          setError("An account with this email already exists.")
        } else if (status === 422) {
          setError("Please check the information you entered and try again.")
        } else if (status && status >= 500) {
          setError("The server encountered an error. Please try again.")
        } else if (err.request) {
          setError("Unable to connect to the CoinCrest server. Make sure the backend is running.")
        } else {
          setError("Registration failed. Please try again.")
        }
      } else {
        setError("Registration failed. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Create your workspace"
      title="Start with a stronger process."
      description="Create your CoinCrest workspace and explore the product with simulated capital first."
      asideTitle="Build the process before the position."
      asideDescription="Research with AHNA, rehearse with paper capital, and learn how risk changes before you decide whether to act."
    >
      {error && (
        <div
          role="alert"
          className="mb-6 flex gap-3 rounded-2xl border border-[#D6A12A]/35 bg-[#FFEA93]/35 px-4 py-3.5 text-[14px] leading-6 text-[#60460B]"
        >
          <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label htmlFor="displayName" className="mb-2.5 block text-[14px] font-black text-[#07111F]">
            Full name
          </label>
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#07111F]/30" />
            <input
              id="displayName"
              name="displayName"
              type="text"
              autoComplete="name"
              required
              autoFocus
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Your name"
              className="min-h-[54px] w-full rounded-2xl border border-[#07111F]/12 bg-[#FFFEFA] py-3 pl-12 pr-4 text-[15px] text-[#07111F] outline-none transition placeholder:text-[#07111F]/30 focus:border-[#2F78B7] focus:ring-4 focus:ring-[#2F78B7]/12"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="mb-2.5 block text-[14px] font-black text-[#07111F]">
            Email address
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#07111F]/30" />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="min-h-[54px] w-full rounded-2xl border border-[#07111F]/12 bg-[#FFFEFA] py-3 pl-12 pr-4 text-[15px] text-[#07111F] outline-none transition placeholder:text-[#07111F]/30 focus:border-[#2F78B7] focus:ring-4 focus:ring-[#2F78B7]/12"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="mb-2.5 block text-[14px] font-black text-[#07111F]">
            Password
          </label>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#07111F]/30" />
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              className="min-h-[54px] w-full rounded-2xl border border-[#07111F]/12 bg-[#FFFEFA] py-3 pl-12 pr-14 text-[15px] text-[#07111F] outline-none transition placeholder:text-[#07111F]/30 focus:border-[#2F78B7] focus:ring-4 focus:ring-[#2F78B7]/12"
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

          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {passwordChecks.map((check) => (
              <span
                key={check.label}
                className={`inline-flex items-center gap-1.5 text-[10px] font-bold ${check.met ? "text-[#267A57]" : "text-[#07111F]/35"}`}
              >
                <span className={`flex h-4 w-4 items-center justify-center rounded-full ${check.met ? "bg-[#70C891]/18" : "bg-[#07111F]/6"}`}>
                  <Check className="h-2.5 w-2.5" />
                </span>
                {check.label}
              </span>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="mb-2.5 block text-[14px] font-black text-[#07111F]">
            Confirm password
          </label>
          <div className="relative">
            <ShieldCheck className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#07111F]/30" />
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repeat your password"
              className="min-h-[54px] w-full rounded-2xl border border-[#07111F]/12 bg-[#FFFEFA] py-3 pl-12 pr-14 text-[15px] text-[#07111F] outline-none transition placeholder:text-[#07111F]/30 focus:border-[#2F78B7] focus:ring-4 focus:ring-[#2F78B7]/12"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((value) => !value)}
              aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              aria-pressed={showConfirmPassword}
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-[#07111F]/40 transition hover:bg-[#2F78B7]/8 hover:text-[#164F7D]"
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-h-[56px] w-full items-center justify-center gap-2 rounded-full bg-[#164F7D] px-6 text-[15px] font-black text-white shadow-[0_14px_34px_rgba(22,79,125,0.2)] transition hover:-translate-y-0.5 hover:bg-[#103F65] hover:shadow-[0_18px_42px_rgba(22,79,125,0.26)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {loading ? "Creating your workspace…" : "Create account"}
          {!loading && <ArrowRight className="h-4 w-4" />}
        </button>
      </form>

      <div className="mt-7 border-t border-[#07111F]/10 pt-6 text-center text-[14px] text-[#07111F]/55">
        Already have an account?{" "}
        <Link href="/login" className="font-black text-[#164F7D] transition hover:text-[#2F78B7] hover:underline">
          Sign in
        </Link>
      </div>
    </AuthShell>
  )
}
