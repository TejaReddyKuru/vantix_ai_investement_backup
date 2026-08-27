"use client"

import Link from "next/link"
import { ReactNode } from "react"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  BrainCircuit,
  Check,
  ShieldCheck,
  Sparkles,
} from "lucide-react"

import CoinCrestBrand from "../branding/CoinCrestBrand"

type AuthShellProps = {
  eyebrow: string
  title: string
  description: string
  asideTitle: string
  asideDescription: string
  children: ReactNode
  footer?: ReactNode
}

const trustSignals = [
  {
    icon: BrainCircuit,
    title: "Specialist intelligence",
    body: "AHNA combines market, news, sentiment, portfolio, and risk evidence.",
  },
  {
    icon: ShieldCheck,
    title: "Risk before action",
    body: "Every idea is reviewed against context, uncertainty, and your limits.",
  },
  {
    icon: Check,
    title: "You stay in control",
    body: "Start with paper capital and approve every action yourself.",
  },
]

export default function AuthShell({
  eyebrow,
  title,
  description,
  asideTitle,
  asideDescription,
  children,
  footer,
}: AuthShellProps) {
  return (
    <main className="min-h-screen bg-[#FBF8EE] text-[#07111F]">
      <div className="grid min-h-screen lg:grid-cols-[minmax(430px,0.92fr)_minmax(560px,1.08fr)]">
        <aside className="relative overflow-hidden bg-[#07111F] text-white">
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div className="absolute -right-40 -top-40 h-[34rem] w-[34rem] rounded-full border border-[#2F78B7]/35" />
            <div className="absolute -right-20 -top-20 h-[26rem] w-[26rem] rounded-full border border-[#70C891]/25" />
            <div className="absolute right-14 top-16 h-[16rem] w-[16rem] rounded-full bg-[#2F78B7]/20 blur-[90px]" />
            <div className="absolute -bottom-32 -left-24 h-[26rem] w-[26rem] rounded-full bg-[#70C891]/10 blur-[100px]" />
            <div
              className="absolute inset-0 opacity-[0.045]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
                backgroundSize: "52px 52px",
              }}
            />
          </div>

          <div className="relative flex h-full min-h-[410px] flex-col px-6 py-7 sm:px-10 sm:py-9 lg:min-h-screen lg:px-12 lg:py-11 xl:px-16 xl:py-14">
            <div className="flex items-center justify-between">
              <Link href="/" aria-label="CoinCrest home" className="inline-flex">
                <CoinCrestBrand inverted />
              </Link>

              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/62">
                <span className="h-1.5 w-1.5 rounded-full bg-[#70C891] shadow-[0_0_12px_rgba(112,200,145,0.75)]" />
                Secure access
              </span>
            </div>

            <div className="my-auto py-12 lg:py-16">
              <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#FFEA93]">
                <Sparkles className="h-4 w-4" />
                Decision intelligence with restraint
              </div>

              <h2 className="mt-6 max-w-[650px] font-serif text-[clamp(3.25rem,5.3vw,6.4rem)] leading-[0.86] tracking-[-0.062em] text-[#FFF8E0]">
                {asideTitle}
              </h2>

              <p className="mt-7 max-w-[580px] text-[16px] leading-7 text-white/58 sm:text-[18px] sm:leading-8">
                {asideDescription}
              </p>

              <div className="mt-10 hidden max-w-[620px] grid-cols-1 gap-3 sm:grid lg:grid-cols-1 xl:grid-cols-3">
                {trustSignals.map(({ icon: Icon, title: signalTitle, body }) => (
                  <div
                    key={signalTitle}
                    className="rounded-[22px] border border-white/10 bg-white/[0.045] p-5 backdrop-blur-sm"
                  >
                    <Icon className="h-5 w-5 text-[#70C891]" />
                    <h3 className="mt-5 text-[14px] font-black text-white">{signalTitle}</h3>
                    <p className="mt-2 text-[12px] leading-5 text-white/44">{body}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-[10px] font-bold uppercase tracking-[0.12em] text-white/32">
              <span>Paper first</span>
              <span>Evidence over impulse</span>
              <span>© 2026 CoinCrest</span>
            </div>
          </div>
        </aside>

        <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-12 sm:px-8 lg:px-12 xl:px-20">
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div className="absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-[#FFEA93]/45 blur-[100px]" />
            <div className="absolute -bottom-44 left-1/4 h-[28rem] w-[28rem] rounded-full bg-[#70C891]/16 blur-[110px]" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-[560px]"
          >
            <div className="mb-8 flex items-center justify-between gap-4">
              <Link
                href="/"
                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#07111F]/10 bg-white/55 px-4 text-[13px] font-bold text-[#07111F]/65 transition hover:border-[#2F78B7]/35 hover:bg-white hover:text-[#164F7D]"
              >
                <ArrowLeft className="h-4 w-4" />
                Back home
              </Link>

              <span className="text-right text-[10px] font-black uppercase tracking-[0.16em] text-[#07111F]/35">
                Trade smarter. Rise higher.
              </span>
            </div>

            <div className="mb-7">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#2F78B7]">{eyebrow}</p>
              <h1 className="mt-4 font-serif text-[clamp(3.2rem,6vw,5.25rem)] leading-[0.87] tracking-[-0.06em] text-[#07111F]">
                {title}
              </h1>
              <p className="mt-5 max-w-[510px] text-[16px] leading-7 text-[#07111F]/58 sm:text-[17px]">
                {description}
              </p>
            </div>

            <div className="rounded-[28px] border border-[#07111F]/10 bg-white/78 p-5 shadow-[0_28px_90px_rgba(7,17,31,0.1)] backdrop-blur-xl sm:p-8">
              {children}
            </div>

            {footer && <div className="mt-5 text-center">{footer}</div>}

            <p className="mt-6 text-center text-[11px] leading-5 text-[#07111F]/38">
              By continuing, you agree to the CoinCrest <Link href="/terms" className="font-bold text-[#164F7D] hover:underline">Terms</Link>. Crypto assets involve substantial risk.
            </p>
          </motion.div>
        </section>
      </div>
    </main>
  )
}
