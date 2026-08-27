"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import axios from "axios"
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
      const response = await axios.post(
        "/api/v1/auth/request-password-reset",
        {
          email: email.trim(),
        }
      )

      setMessage(
        response.data?.message ||
          "If an account exists, a reset link has been sent."
      )
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail

        if (Array.isArray(detail)) {
          setError(detail.map((item) => item.msg).join(", "))
        } else {
          setError(detail || "Unable to process your request.")
        }
      } else {
        setError("Unable to process your request.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Reset your password"
      description="Enter your email and we'll help you get back into your account."
    >
      {message && (
        <div className="mb-5 rounded-xl border border-[#173F2A]/15 bg-[#E8F5E9] px-4 py-3 text-sm leading-6 text-[#173F2A]">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-semibold text-[#34342F]"
          >
            Email address
          </label>

          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-[#E2E1D5] bg-[#FAFAF7] px-4 py-3 text-sm text-[#171717] outline-none transition placeholder:text-[#99998F] focus:border-[#173F2A] focus:ring-4 focus:ring-[#173F2A]/10"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[#173F2A] px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(23,63,42,0.16)] transition hover:-translate-y-0.5 hover:bg-[#245C3F] hover:shadow-[0_14px_30px_rgba(23,63,42,0.20)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Sending..." : "Send reset instructions"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-[#E2E1D5]" />
        <span className="text-xs font-medium text-[#9A998F]">OR</span>
        <div className="h-px flex-1 bg-[#E2E1D5]" />
      </div>

      <div className="text-center text-sm text-[#6B6B63]">
        Remember your password?{" "}
        <Link
          href="/login"
          className="font-semibold text-[#173F2A] transition hover:text-[#245C3F]"
        >
          Sign in
        </Link>
      </div>

      <div className="mt-4 text-center text-sm text-[#8A897F]">
        Don't have an account?{" "}
        <Link
          href="/register"
          className="font-semibold text-[#173F2A] transition hover:text-[#245C3F]"
        >
          Create your account
        </Link>
      </div>
    </AuthShell>
  )
}

