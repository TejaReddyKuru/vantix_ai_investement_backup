import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, ArrowRight, BrainCircuit, ShieldCheck, Sparkles, Target } from "lucide-react"
import CoinCrestBrand from "../../components/branding/CoinCrestBrand"
import SiteFooter from "../../components/landing/SiteFooter"

export const metadata: Metadata = {
  title: "About",
  description: "Why CoinCrest and AHNA are being built for more disciplined crypto decision-making.",
}

const principles = [
  {
    icon: BrainCircuit,
    title: "Evidence over noise",
    body: "Research should connect market structure, news, sentiment, and risk—not reward whoever speaks with the most confidence.",
  },
  {
    icon: ShieldCheck,
    title: "Risk before excitement",
    body: "A trade idea is incomplete until exposure, invalidation, downside, and portfolio impact are visible.",
  },
  {
    icon: Target,
    title: "Practice before pressure",
    body: "Paper trading gives users room to build a repeatable process before live capital changes the psychology of a decision.",
  },
  {
    icon: Sparkles,
    title: "AI that explains itself",
    body: "AHNA exposes evidence, agent agreement, uncertainty, and invalidation so users can inspect—not blindly trust—its output.",
  },
]

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#FBF8EE] text-[#07111F]">
      <header className="border-b border-black/10 bg-[#FBF8EE]">
        <div className="mx-auto flex h-[82px] max-w-[1240px] items-center justify-between px-5 sm:px-8">
          <Link href="/"><CoinCrestBrand /></Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="hidden items-center gap-2 text-[13px] font-bold sm:flex"><ArrowLeft className="h-4 w-4" /> Home</Link>
            <Link href="/register" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#2F78B7] px-5 text-[13px] font-black !text-white">Create account <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </header>

      <section className="border-b border-black/80 bg-[#F4E7B2]">
        <div className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 lg:py-32">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#2F78B7]">About CoinCrest</p>
          <h1 className="mt-6 max-w-[1040px] font-serif text-[clamp(4.4rem,8.5vw,9.2rem)] leading-[0.82] tracking-[-0.068em]">
            Better decisions begin before the trade.
          </h1>
          <p className="mt-9 max-w-[760px] text-[19px] leading-8 text-black/65">
            CoinCrest is being built for people who want to participate in crypto markets without surrendering their process to hype, fragmented tools, or unexplained AI answers.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8">
        <div className="grid gap-14 lg:grid-cols-[0.72fr_1.28fr]">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#2F78B7]">What we believe</p>
            <h2 className="mt-5 font-serif text-[clamp(3.4rem,5.6vw,5.9rem)] leading-[0.88] tracking-[-0.058em]">A trading product should reduce confusion—not manufacture urgency.</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {principles.map(({ icon: Icon, title, body }) => (
              <article key={title} className="rounded-[28px] border border-black/14 bg-white p-7">
                <Icon className="h-6 w-6 text-[#2F78B7]" />
                <h3 className="mt-12 text-[24px] font-black tracking-[-0.035em]">{title}</h3>
                <p className="mt-4 text-[15px] leading-7 text-black/58">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-black text-white">
        <div className="mx-auto grid max-w-[1240px] gap-12 px-5 py-24 sm:px-8 lg:grid-cols-2 lg:py-28">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#70C891]">How AHNA is formed</p>
            <h2 className="mt-5 font-serif text-[clamp(3.7rem,6.5vw,6.8rem)] leading-[0.86] tracking-[-0.062em]">Specialists investigate. AHNA orchestrates.</h2>
          </div>
          <div className="space-y-7 text-[17px] leading-8 text-white/62">
            <p>Market, news, sentiment, risk, and trade-alert agents each examine the evidence they are designed to understand.</p>
            <p>AHNA combines their findings, checks for conflict, tests the conclusion against risk limits, and returns a brief that explains both the opportunity and the reasons it could be wrong.</p>
            <p>The goal is not to replace a user’s judgment. It is to make that judgment better informed, more inspectable, and more consistent.</p>
          </div>
        </div>
      </section>

      <section className="bg-[#A9CFAF]">
        <div className="mx-auto flex max-w-[1240px] flex-col items-start justify-between gap-8 px-5 py-16 sm:px-8 lg:flex-row lg:items-center">
          <h2 className="max-w-[860px] font-serif text-[clamp(3.3rem,5.6vw,5.8rem)] leading-[0.88] tracking-[-0.055em]">Explore the product with simulated capital first.</h2>
          <Link href="/register" className="inline-flex min-h-14 shrink-0 items-center gap-2 rounded-full bg-[#080908] px-7 text-[15px] font-black text-[#FFF4D0] shadow-[0_12px_28px_rgba(0,0,0,0.14)] transition hover:-translate-y-0.5 hover:bg-[#171A16]">
            <span>Get started</span> <ArrowRight className="h-4 w-4 text-[#FFF4D0]" />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
