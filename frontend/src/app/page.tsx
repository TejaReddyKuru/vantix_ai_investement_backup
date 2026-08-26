import Link from "next/link"
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BrainCircuit,
  Check,
  Eye,
  Layers3,
  Newspaper,
  Radar,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  WalletCards,
} from "lucide-react"
import CoinCrestBrand from "../components/branding/CoinCrestBrand"
import Hero3D from "../components/landing/Hero3D"
import SiteFooter from "../components/landing/SiteFooter"

const markets = [
  { symbol: "BTC", price: "$111,820", change: "+2.84%", positive: true },
  { symbol: "ETH", price: "$4,632", change: "+1.72%", positive: true },
  { symbol: "SOL", price: "$213.08", change: "+3.11%", positive: true },
  { symbol: "USDT", price: "$1.00", change: "+0.01%", positive: true },
  { symbol: "BNB", price: "$884.56", change: "+0.93%", positive: true },
  { symbol: "XRP", price: "$3.08", change: "-1.21%", positive: false },
  { symbol: "ADA", price: "$0.91", change: "+0.38%", positive: true },
  { symbol: "AVAX", price: "$32.47", change: "-0.46%", positive: false },
]

const capabilities = [
  {
    number: "01",
    icon: BrainCircuit,
    title: "Market intelligence",
    description: "See momentum, volatility, structure, news, and sentiment in one deliberate workspace.",
  },
  {
    number: "02",
    icon: WalletCards,
    title: "Portfolio clarity",
    description: "Understand allocation, exposure, performance, and concentration before they become surprises.",
  },
  {
    number: "03",
    icon: ShieldCheck,
    title: "Risk before action",
    description: "Review position size, drawdown, invalidation, and portfolio limits before capital is deployed.",
  },
  {
    number: "04",
    icon: BarChart3,
    title: "Paper execution",
    description: "Rehearse ideas with simulated capital, then learn from every decision in your trading journal.",
  },
]

const agents = [
  {
    icon: TrendingUp,
    name: "Market agent",
    input: "Price · volume · structure",
    output: "Finds trend, momentum, volatility shifts, and important levels across supported markets.",
    color: "#FFEA93",
  },
  {
    icon: Newspaper,
    name: "News agent",
    input: "Events · sources · relevance",
    output: "Filters market-moving information, removes noise, and connects events to affected assets.",
    color: "#8DB355",
  },
  {
    icon: Radar,
    name: "Sentiment agent",
    input: "Narratives · attention · tone",
    output: "Reads shifts in market psychology without treating popularity as proof of a trade.",
    color: "#FFEA93",
  },
  {
    icon: ShieldCheck,
    name: "Risk agent",
    input: "Exposure · limits · drawdown",
    output: "Challenges every idea against account constraints, invalidation, and portfolio-level risk.",
    color: "#D90000",
  },
  {
    icon: Target,
    name: "Trade-alert agent",
    input: "Setups · confirmation · timing",
    output: "Turns confirmed conditions into reviewable alerts with context, risk, and invalidation attached.",
    color: "#8DB355",
  },
  {
    icon: Sparkles,
    name: "AHNA orchestrator",
    input: "Evidence · conflict · confidence",
    output: "Combines specialist findings, detects disagreement, and produces one explainable market brief.",
    color: "#D90000",
  },
]

const steps = [
  { number: "01", title: "Ask", body: "Choose a market or ask AHNA a plain-language question." },
  { number: "02", title: "Inspect", body: "Review evidence, agent agreement, risk, and invalidation." },
  { number: "03", title: "Rehearse", body: "Test the thesis with paper capital before considering live execution." },
  { number: "04", title: "Learn", body: "Journal the outcome so your process improves instead of merely repeating." },
]

const faqs = [
  {
    q: "Does AHNA place trades for me?",
    a: "AHNA is designed to improve analysis and decision quality. It presents evidence, uncertainty, and risk; you remain in control of every action.",
  },
  {
    q: "Can I start without risking money?",
    a: "Yes. CoinCrest includes a paper-trading workflow so you can rehearse decisions with simulated capital before going further.",
  },
  {
    q: "How do the AI agents become AHNA?",
    a: "Each specialist agent studies a different evidence stream. AHNA orchestrates their findings, checks conflicts and risk, then explains what supports the conclusion and what could invalidate it.",
  },
  {
    q: "Is CoinCrest financial advice?",
    a: "No. CoinCrest provides research, analytics, and educational decision-support tools. Crypto assets are volatile, and users remain responsible for their decisions.",
  },
]

function SectionLabel({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <div className={`mb-5 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] ${dark ? "text-[#FFEA93]" : "text-black/55"}`}>
      <span className={`h-2 w-2 rounded-full ${dark ? "bg-[#D90000]" : "bg-[#D90000]"}`} />
      {children}
    </div>
  )
}

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#FFFCF5] text-black">
      <div className="grid min-h-9 grid-cols-1 items-center bg-black px-5 text-[10px] font-black uppercase tracking-[0.12em] text-white sm:grid-cols-3 sm:px-8 lg:px-16">
        <span className="hidden sm:block">CoinCrest early access</span>
        <span className="py-2 text-center text-[#FFEA93]">Paper first. Live when you are ready.</span>
        <Link href="/register" className="hidden items-center justify-end gap-1.5 transition-colors hover:text-[#FFEA93] sm:flex">
          Create account <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>

      <header className="sticky top-0 z-50 border-b border-black/10 bg-[#FFFCF5]/94 backdrop-blur-xl">
        <div className="mx-auto flex h-[82px] max-w-[1380px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <Link href="/" aria-label="CoinCrest home">
            <CoinCrestBrand />
          </Link>

          <nav className="hidden items-center gap-8 text-[13px] font-bold lg:flex">
            <a href="#markets" className="transition-colors hover:text-[#D90000]">Markets</a>
            <a href="#platform" className="transition-colors hover:text-[#D90000]">Platform</a>
            <a href="#ahna" className="transition-colors hover:text-[#D90000]">AHNA</a>
            <Link href="/about" className="transition-colors hover:text-[#D90000]">About</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden px-3 py-2 text-[13px] font-bold sm:block">Sign in</Link>
            <Link
              href="/register"
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#D90000] px-5 text-[13px] font-black text-white shadow-[0_10px_30px_rgba(217,0,0,0.22)] transition hover:-translate-y-0.5 hover:bg-[#B90000]"
            >
              Create account <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <section id="markets" className="border-b border-black/10 bg-white">
        <div className="flex min-w-max animate-[marquee_35s_linear_infinite]">
          {[...markets, ...markets].map((market, index) => (
            <div key={`${market.symbol}-${index}`} className="flex h-10 items-center gap-3 border-r border-black/10 px-5 text-[11px]">
              <b>{market.symbol}</b>
              <span className="text-black/55">{market.price}</span>
              <span className={market.positive ? "font-bold text-[#55752E]" : "font-bold text-[#D90000]"}>{market.change}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="relative min-h-[720px] overflow-hidden bg-black lg:min-h-[calc(100svh-158px)]">
        <Hero3D />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(3,4,5,0.94)_0%,rgba(3,4,5,0.82)_34%,rgba(3,4,5,0.42)_60%,rgba(3,4,5,0.12)_100%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,rgba(3,4,5,0.52)_0%,transparent_38%,rgba(3,4,5,0.16)_100%)]" />

        <div className="relative z-10 mx-auto flex min-h-[720px] max-w-[1380px] items-center px-5 py-20 sm:px-8 lg:min-h-[calc(100svh-158px)] lg:px-12">
          <div className="max-w-[680px]">
            <SectionLabel dark>Crypto intelligence with restraint</SectionLabel>
            <h1 className="font-serif text-[clamp(3.7rem,7vw,7.4rem)] leading-[0.84] tracking-[-0.065em] text-[#FFF8E0]">
              Trade what you see.
              <span className="mt-2 block text-[#FFF8E0]">Understand what you <span className="text-[#D90000]">risk.</span></span>
            </h1>
            <p className="mt-8 max-w-[600px] text-[18px] leading-8 text-white/68 sm:text-[20px]">
              CoinCrest turns fragmented crypto signals into one explainable workflow—so you can research, rehearse, and act with greater discipline.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-[#D90000] px-7 text-[15px] font-black text-white transition hover:-translate-y-0.5 hover:bg-[#B90000]">
                Start with paper trading <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#ahna" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 px-7 text-[15px] font-black text-white backdrop-blur-xl transition hover:bg-white hover:text-black">
                See how AHNA thinks <Eye className="h-4 w-4" />
              </a>
            </div>

            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-[12px] font-bold text-white/55">
              {['No card to explore', 'Paper capital first', 'You approve every action'].map((item) => (
                <span key={item} className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[#8DB355]" />{item}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="platform" className="border-y border-black/80 bg-[#F4E7B2]">
        <div className="mx-auto max-w-[1380px] px-5 py-24 sm:px-8 lg:px-12">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <SectionLabel>A deliberate trading system</SectionLabel>
              <h2 className="max-w-[560px] font-serif text-[clamp(3rem,5vw,5.6rem)] leading-[0.92] tracking-[-0.055em]">
                More context.<br />Fewer blind decisions.
              </h2>
            </div>
            <p className="max-w-[690px] self-end text-[18px] leading-8 text-black/68 lg:justify-self-end">
              Most trading tools reward speed and activity. CoinCrest is designed around clarity: understand the setup, see the risk, rehearse the decision, and learn from the outcome.
            </p>
          </div>

          <div className="mt-16 grid border-l border-t border-black/20 sm:grid-cols-2 lg:grid-cols-4">
            {capabilities.map(({ number, icon: Icon, title, description }) => (
              <article key={number} className="min-h-[310px] border-b border-r border-black/16 bg-[#FBF6DF] p-7 transition hover:bg-[#FFFDF5]">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-black">{number}</span>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-24 text-[25px] font-black tracking-[-0.035em]">{title}</h3>
                <p className="mt-4 text-[15px] leading-6 text-black/62">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="ahna" className="bg-black text-white">
        <div className="mx-auto max-w-[1380px] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
          <div className="grid gap-12 lg:grid-cols-[0.82fr_1.18fr]">
            <div className="lg:sticky lg:top-32 lg:self-start">
              <SectionLabel dark>AHNA multi-agent intelligence</SectionLabel>
              <h2 className="font-serif text-[clamp(3.4rem,6vw,6.5rem)] leading-[0.88] tracking-[-0.06em]">
                Five specialists.<br /><span className="text-[#FFEA93]">One clear brief.</span>
              </h2>
              <p className="mt-8 max-w-[560px] text-[18px] leading-8 text-white/62">
                AHNA is not a single chatbot guessing at the market. It is an orchestrated system of specialist agents that investigate different evidence, challenge one another, and show their reasoning.
              </p>

              <div className="mt-9 rounded-[26px] border border-white/12 bg-white/[0.045] p-6">
                <div className="flex items-center gap-3 text-[12px] font-black uppercase tracking-[0.14em] text-[#8DB355]">
                  <Layers3 className="h-5 w-5" /> How a response is formed
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-2 text-[12px] font-bold">
                  {['Question', 'Specialist evidence', 'Conflict check', 'Risk review', 'AHNA brief'].map((stage, index, all) => (
                    <span key={stage} className="contents">
                      <span className={`rounded-full border px-3 py-2 ${index === all.length - 1 ? 'border-[#D90000] bg-[#D90000] text-white' : 'border-white/15 bg-white/5 text-white/70'}`}>{stage}</span>
                      {index < all.length - 1 && <ArrowRight className="h-3 w-3 text-white/30" />}
                    </span>
                  ))}
                </div>
                <p className="mt-5 text-[13px] leading-6 text-white/45">
                  If agents disagree or evidence is weak, AHNA lowers confidence and explains the conflict instead of hiding uncertainty.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {agents.map(({ icon: Icon, name, input, output, color }, index) => (
                <article key={name} className={`rounded-[28px] border border-white/12 p-7 ${index === agents.length - 1 ? 'bg-[#D90000] sm:col-span-2' : 'bg-white/[0.045]'}`}>
                  <div className="flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10"><Icon className="h-5 w-5" style={{ color }} /></span>
                    <span className="text-[10px] font-black uppercase tracking-[0.16em] text-white/38">Agent {String(index + 1).padStart(2, '0')}</span>
                  </div>
                  <h3 className="mt-7 text-[25px] font-black tracking-[-0.035em]">{name}</h3>
                  <p className={`mt-2 text-[11px] font-black uppercase tracking-[0.13em] ${index === agents.length - 1 ? 'text-[#FFEA93]' : 'text-[#8DB355]'}`}>{input}</p>
                  <p className={`mt-4 text-[15px] leading-7 ${index === agents.length - 1 ? 'text-white/85' : 'text-white/58'}`}>{output}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#A8C47A]">
        <div className="mx-auto max-w-[1380px] px-5 py-24 sm:px-8 lg:px-12">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div>
              <SectionLabel>From question to discipline</SectionLabel>
              <h2 className="font-serif text-[clamp(3.1rem,5vw,5.5rem)] leading-[0.9] tracking-[-0.055em]">A calmer way to build conviction.</h2>
            </div>
            <Link href="/register" className="inline-flex min-h-13 shrink-0 items-center justify-center gap-2 rounded-full bg-[#080908] px-6 text-[14px] font-black text-[#FFF4D0] shadow-[0_12px_28px_rgba(0,0,0,0.14)] transition hover:-translate-y-0.5 hover:bg-[#171A16]">
              <span>Create your workspace</span> <ArrowRight className="h-4 w-4 text-[#FFF4D0]" />
            </Link>
          </div>

          <div className="mt-14 grid border-l border-t border-black/20 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
              <article key={step.number} className="min-h-[250px] border-b border-r border-black/20 p-7">
                <span className="text-[12px] font-black">{step.number}</span>
                <h3 className="mt-20 text-[28px] font-black tracking-[-0.04em]">{step.title}</h3>
                <p className="mt-3 text-[15px] leading-6 text-black/65">{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#FFFCF5]">
        <div className="mx-auto grid max-w-[1380px] gap-14 px-5 py-24 sm:px-8 lg:grid-cols-[0.75fr_1.25fr] lg:px-12 lg:py-28">
          <div>
            <SectionLabel>Questions before capital</SectionLabel>
            <h2 className="font-serif text-[clamp(3rem,5vw,5.2rem)] leading-[0.92] tracking-[-0.055em]">Know what the product does—and what it does not.</h2>
          </div>
          <div className="border-t border-black">
            {faqs.map((faq) => (
              <details key={faq.q} className="group border-b border-black/18 py-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-[18px] font-black">
                  {faq.q}<span className="text-2xl font-normal transition group-open:rotate-45">+</span>
                </summary>
                <p className="max-w-[720px] pb-2 pt-4 text-[15px] leading-7 text-black/58">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-black bg-[#D90000] text-white">
        <div className="mx-auto flex max-w-[1380px] flex-col items-start justify-between gap-8 px-5 py-16 sm:px-8 lg:flex-row lg:items-center lg:px-12">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#FFEA93]">Start with simulated capital</p>
            <h2 className="mt-3 font-serif text-[clamp(2.8rem,5vw,5rem)] leading-[0.9] tracking-[-0.05em]">Build the process before the position.</h2>
          </div>
          <Link href="/register" className="inline-flex min-h-14 shrink-0 items-center gap-2 rounded-full bg-[#FFEA93] px-7 text-[15px] font-black text-black transition hover:-translate-y-0.5">
            Get started <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
