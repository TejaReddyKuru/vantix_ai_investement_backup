"use client"

import { FormEvent, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import axios from "axios"

import { useAuth } from "../../context/AuthContext"
import AuthShell from "../../components/auth/AuthShell"

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(false)

  const { login } = useAuth()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setRegistered(params.get("registered") === "true")
  }, [])

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setError(null)
    setLoading(true)

    try {
      await login(email.trim(), password)
      router.push("/dashboard")
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
          setError("Invalid email or password.")
        }
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Invalid email or password.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to your AI-powered trading workspace."
    >
      {registered && (
        <div className="mb-5 rounded-xl border border-[#173F2A]/15 bg-[#E8F5E9] px-4 py-3 text-sm text-[#173F2A]">
          Account created successfully. You can now sign in.
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
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

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-[#34342F]"
            >
              Password
            </label>

            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-[#173F2A] transition hover:text-[#245C3F]"
            >
              Forgot password?
            </Link>
          </div>

          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              className="w-full rounded-xl border border-[#E2E1D5] bg-[#FAFAF7] px-4 py-3 pr-16 text-sm text-[#171717] outline-none transition placeholder:text-[#99998F] focus:border-[#173F2A] focus:ring-4 focus:ring-[#173F2A]/10"
            />

            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#7A7971] transition hover:text-[#173F2A]"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[#173F2A] px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(23,63,42,0.16)] transition hover:-translate-y-0.5 hover:bg-[#245C3F] hover:shadow-[0_14px_30px_rgba(23,63,42,0.20)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-[#E2E1D5]" />

        <span className="text-xs font-medium text-[#9A998F]">
          OR
        </span>

        <div className="h-px flex-1 bg-[#E2E1D5]" />
      </div>

      <div className="text-center text-sm text-[#6B6B63]">
        Don&apos;t have an account?{" "}

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