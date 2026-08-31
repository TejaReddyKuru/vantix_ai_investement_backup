"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import axios from "axios"
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  KeyRound,
  Mail,
  ShieldCheck,
} from "lucide-react"

import { apiClient } from "../../lib/client"
import AuthShell from "../../components/auth/AuthShell"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage(null)
    setError(null)
    setLoading(true)

    try {
      const response = await apiClient.post("/api/v1/auth/request-password-reset", {
        email: email.trim().toLowerCase(),
      })

      setMessage(response.data?.message || "If an account exists, a reset link has been sent.")
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
          setError("Unable to process your request right now.")
        }
      } else {
        setError("Unable to process your request right now.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Reset your password."
      description="Enter the email connected to your workspace. If the account exists, we’ll send the next secure step."
      asideTitle="Regain access. Keep your process intact."
      asideDescription="A secure recovery flow gets you back to your research, paper portfolio, and AHNA briefs without exposing whether an account exists."
    >
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-[#2F78B7]/18 bg-[#2F78B7]/7 px-4 py-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#164F7D] text-white">
          <KeyRound className="h-5 w-5" />
        </span>
        <span>
          <b className="block text-[14px] text-[#07111F]">Private by design</b>
          <small className="mt-1 block text-[12px] leading-5 text-[#07111F]/48">
            The response is intentionally the same whether or not an email is registered.
          </small>
        </span>
      </div>

      {message && (
        <div
          role="status"
          className="mb-6 flex gap-3 rounded-xl border border-[#70C891]/35 bg-[#70C891]/12 px-4 py-3.5 text-[14px] leading-6 text-[#155B3B]"
        >
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{message}</span>
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

        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-h-[56px] w-full items-center justify-center gap-2 rounded-md bg-[#164F7D] px-6 text-[15px] font-black text-white shadow-[0_14px_34px_rgba(22,79,125,0.2)] transition hover:-translate-y-0.5 hover:bg-[#103F65] hover:shadow-[0_18px_42px_rgba(22,79,125,0.26)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {loading ? "Sending secure instructions…" : "Send reset instructions"}
          {!loading && <ArrowRight className="h-4 w-4" />}
        </button>
      </form>

      <div className="mt-5 flex items-center justify-center gap-2 text-[12px] font-bold text-[#07111F]/42">
        <ShieldCheck className="h-4 w-4 text-[#2D8C68]" />
        For safety, use only the newest reset email you receive.
      </div>

      <div className="mt-7 grid gap-3 border-t border-[#07111F]/10 pt-6 text-center text-[14px] sm:grid-cols-2">
        <Link href="/login" className="inline-flex items-center justify-center gap-2 font-black text-[#164F7D] transition hover:text-[#2F78B7] hover:underline">
          <ArrowLeft className="h-4 w-4" /> Sign in
        </Link>
        <Link href="/register" className="font-black text-[#164F7D] transition hover:text-[#2F78B7] hover:underline">
          Create an account
        </Link>
      </div>
    </AuthShell>
  )
}
