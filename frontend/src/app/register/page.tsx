"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import axios from "axios"

import { apiClient } from "../../lib/client"
import AuthShell from "../../components/auth/AuthShell"

export default function RegisterPage() {
  const router = useRouter()

  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

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
            .map((item) => {
              if (
                typeof item === "object" &&
                item !== null &&
                "msg" in item
              ) {
                return String(item.msg)
              }

              return String(item)
            })
            .filter(Boolean)

          setError(
            messages.length > 0
              ? messages.join(", ")
              : "Registration failed. Please check your information."
          )
        } else if (typeof detail === "string") {
          setError(detail)
        } else if (status === 400) {
          setError("Registration request was rejected. Please check your information.")
        } else if (status === 409) {
          setError("An account with this email already exists.")
        } else if (status === 422) {
          setError("Please check the information you entered and try again.")
        } else if (status && status >= 500) {
          setError("The server encountered an error. Please try again.")
        } else if (err.request) {
          setError(
            "Unable to connect to the Vish Capitals server. Make sure the backend is running."
          )
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
      title="Create your account"
      description="Start your journey with AI-powered trading intelligence."
    >
      {error && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-5">
        {/* Full name */}
        <div>
          <label
            htmlFor="displayName"
            className="mb-2 block text-sm font-semibold text-[#34342F]"
          >
            Full name
          </label>

          <input
            id="displayName"
            name="displayName"
            type="text"
            autoComplete="name"
            required
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Your name"
            className="w-full rounded-xl border border-[#E2E1D5] bg-[#FAFAF7] px-4 py-3 text-sm text-[#171717] outline-none transition placeholder:text-[#99998F] focus:border-[#173F2A] focus:ring-4 focus:ring-[#173F2A]/10"
          />
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-semibold text-[#34342F]"
          >
            Email address
          </label>

          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-[#E2E1D5] bg-[#FAFAF7] px-4 py-3 text-sm text-[#171717] outline-none transition placeholder:text-[#99998F] focus:border-[#173F2A] focus:ring-4 focus:ring-[#173F2A]/10"
          />
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-sm font-semibold text-[#34342F]"
          >
            Password
          </label>

          <div className="relative">
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
              className="w-full rounded-xl border border-[#E2E1D5] bg-[#FAFAF7] px-4 py-3 pr-16 text-sm text-[#171717] outline-none transition placeholder:text-[#99998F] focus:border-[#173F2A] focus:ring-4 focus:ring-[#173F2A]/10"
            />

            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#7A7971] transition hover:text-[#173F2A]"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {/* Confirm password */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-2 block text-sm font-semibold text-[#34342F]"
          >
            Confirm password
          </label>

          <div className="relative">
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
              className="w-full rounded-xl border border-[#E2E1D5] bg-[#FAFAF7] px-4 py-3 pr-16 text-sm text-[#171717] outline-none transition placeholder:text-[#99998F] focus:border-[#173F2A] focus:ring-4 focus:ring-[#173F2A]/10"
            />

            <button
              type="button"
              onClick={() => setShowConfirmPassword((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#7A7971] transition hover:text-[#173F2A]"
              aria-label={
                showConfirmPassword
                  ? "Hide confirm password"
                  : "Show confirm password"
              }
            >
              {showConfirmPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[#173F2A] px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(23,63,42,0.16)] transition hover:-translate-y-0.5 hover:bg-[#245C3F] hover:shadow-[0_14px_30px_rgba(23,63,42,0.20)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      {/* Divider */}
      <div className="my-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-[#E2E1D5]" />

        <span className="text-xs font-medium text-[#9A998F]">
          OR
        </span>

        <div className="h-px flex-1 bg-[#E2E1D5]" />
      </div>

      {/* Login link */}
      <div className="text-center text-sm text-[#6B6B63]">
        Already have an account?{" "}

        <Link
          href="/login"
          className="font-semibold text-[#173F2A] transition hover:text-[#245C3F]"
        >
          Sign in
        </Link>
      </div>
    </AuthShell>
  )
}