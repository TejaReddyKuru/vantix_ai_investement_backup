"use client"

import Link from "next/link"
import { ReactNode } from "react"
import { motion } from "framer-motion"

type AuthShellProps = {
  title: string
  description: string
  children: ReactNode
  footer?: ReactNode
}

export default function AuthShell({
  title,
  description,
  children,
  footer,
}: AuthShellProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F7F6E8] text-[#171717]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-48 -top-48 h-[32rem] w-[32rem] rounded-full bg-[#173F2A]/[0.07] blur-3xl" />
        <div className="absolute -right-48 top-1/4 h-[30rem] w-[30rem] rounded-full bg-[#6F806F]/[0.08] blur-3xl" />
        <div className="absolute -bottom-56 left-1/3 h-[28rem] w-[28rem] rounded-full bg-[#173F2A]/[0.05] blur-3xl" />

        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(#173F2A 1px, transparent 1px), linear-gradient(90deg, #173F2A 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-5 py-10 sm:px-6 sm:py-14">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="w-full max-w-[430px]"
        >
          <div className="mb-8 text-center">
            <Link
              href="/"
              className="group inline-flex items-center gap-3"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#173F2A] text-lg font-bold text-white shadow-[0_10px_30px_rgba(23,63,42,0.18)] transition-transform duration-200 group-hover:-translate-y-0.5">
                V
              </span>

              <span className="text-[19px] font-bold tracking-[-0.03em]">
                Vish <span className="text-[#173F2A]">Capitals</span>
              </span>
            </Link>

            <div className="mt-8">
              <h1 className="text-[32px] font-bold tracking-[-0.04em] text-[#111111] sm:text-[36px]">
                {title}
              </h1>

              <p className="mx-auto mt-2 max-w-[350px] text-sm leading-6 text-[#6B6B63]">
                {description}
              </p>
            </div>
          </div>

          <div className="rounded-[24px] border border-[#E2E1D5] bg-white/90 p-6 shadow-[0_24px_70px_rgba(23,23,23,0.08)] backdrop-blur-xl sm:p-8">
            {children}
          </div>

          {footer && (
            <div className="mt-6 text-center">
              {footer}
            </div>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-xs font-medium text-[#8A897F] transition-colors hover:text-[#173F2A]"
            >
              ? Back to Vish Capitals
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  )
}

