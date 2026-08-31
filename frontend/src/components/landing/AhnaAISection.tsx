"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  Bot,
  BrainCircuit,
  Cpu,
  Layers,
  LineChart,
  MessageSquare,
  Newspaper,
  Radar,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  WalletCards,
  Zap,
} from "lucide-react"

interface AgentCapability {
  id: string
  name: string
  role: string
  icon: typeof TrendingUp
  badge: string
  description: string
  evidence: string
  accentColor: string
  borderColor: string
  bgGlow: string
}

const AGENTS_PIPELINE: AgentCapability[] = [
  {
    id: "market",
    name: "Market Agent",
    role: "Technical & Trend",
    icon: TrendingUp,
    badge: "Structure & Flow",
    description: "Evaluates multi-timeframe price structure, volume flow, EMA momentum, and critical support/resistance boundaries.",
    evidence: "OHLCV · Volume Spikes · Support/Resistance",
    accentColor: "#FFEA93",
    borderColor: "border-[#FFEA93]/30",
    bgGlow: "bg-[#FFEA93]/5",
  },
  {
    id: "news",
    name: "News Agent",
    role: "Catalysts & Events",
    icon: Newspaper,
    badge: "Real-time Feeds",
    description: "Filters breaking macro headlines and crypto developments, eliminating noise and linking events directly to affected tokens.",
    evidence: "Macro Events · Regulatory · Protocol Updates",
    accentColor: "#70C891",
    borderColor: "border-[#70C891]/30",
    bgGlow: "bg-[#70C891]/5",
  },
  {
    id: "sentiment",
    name: "Sentiment Agent",
    role: "Market Psychology",
    icon: Radar,
    badge: "Narrative & Tone",
    description: "Measures crowd psychology, fear/greed shifts, and social narrative momentum without confusing hype with trade confirmation.",
    evidence: "Fear & Greed · Narrative Momentum · Social Volume",
    accentColor: "#A78BFA",
    borderColor: "border-[#A78BFA]/30",
    bgGlow: "bg-[#A78BFA]/5",
  },
  {
    id: "risk",
    name: "Risk Agent",
    role: "Capital Protection",
    icon: ShieldCheck,
    badge: "Guardrails & Limits",
    description: "Calculates maximum allowable exposure, drawdown risk, and exact invalidation thresholds before any capital is committed.",
    evidence: "Position Sizing · Max Drawdown · Invalidation Levels",
    accentColor: "#F87171",
    borderColor: "border-[#F87171]/30",
    bgGlow: "bg-[#F87171]/5",
  },
  {
    id: "trade",
    name: "Trade Agent",
    role: "Setup & Execution",
    icon: Target,
    badge: "Actionable Plans",
    description: "Synthesizes confirmed conditions into structured trade plans complete with entry zones, target boundaries, and invalidation stops.",
    evidence: "Risk/Reward Ratio · Entry Zone · Take-Profit Targets",
    accentColor: "#38BDF8",
    borderColor: "border-[#38BDF8]/30",
    bgGlow: "bg-[#38BDF8]/5",
  },
  {
    id: "synthesis",
    name: "AHNA Synthesis",
    role: "Chief AI Orchestrator",
    icon: Sparkles,
    badge: "Final Decision Engine",
    description: "Resolves inter-agent conflicts, weighs evidence strength, calibrates confidence scores, and produces one explainable decision brief.",
    evidence: "Multi-Agent Consensus · Explainable Reasoning",
    accentColor: "#2F78B7",
    borderColor: "border-[#2F78B7]/50",
    bgGlow: "bg-[#2F78B7]/15",
  },
]

const CAPABILITIES = [
  {
    icon: LineChart,
    title: "Market Analysis",
    tag: "Technical Engine",
    desc: "Multi-timeframe trend detection, liquidity walls, order book pressure, and automated support/resistance mapping.",
  },
  {
    icon: Newspaper,
    title: "News Analysis",
    tag: "Catalyst Filter",
    desc: "Real-time NLP filtering of global financial news and crypto headlines to score relevance and market impact.",
  },
  {
    icon: Radar,
    title: "Market Sentiment",
    tag: "Crowd Psychology",
    desc: "Tracks fear/greed cycles, narrative velocity, and social tone shifts to spot divergences and exhaustion points.",
  },
  {
    icon: ShieldAlert,
    title: "Risk Analysis",
    tag: "Capital Guard",
    desc: "Enforces portfolio allocation limits, strict stop-loss math, and invalidation rules before every suggested action.",
  },
  {
    icon: Target,
    title: "Trade Insights",
    tag: "Execution Blueprint",
    desc: "Structured entry zones, high-probability setups, and calibrated risk-reward ratios for disciplined paper and live trading.",
  },
  {
    icon: WalletCards,
    title: "Portfolio Insights",
    tag: "Asset Intelligence",
    desc: "Evaluates token concentration, asset correlations, and performance benchmarks to optimize overall investment exposure.",
  },
]

interface SampleConversation {
  id: string
  label: string
  userQuestion: string
  agentBreakdown: {
    agent: string
    finding: string
    color: string
  }[]
  ahnaSynthesis: string
  decision: "BULLISH" | "NEUTRAL" | "DEFENSIVE"
  confidence: number
  keyLevels: {
    support: string
    resistance: string
    invalidation: string
  }
}

const SAMPLE_CONVERSATIONS: SampleConversation[] = [
  {
    id: "sentiment",
    label: "Market Sentiment",
    userQuestion: "What is the current market sentiment on BTC?",
    agentBreakdown: [
      { agent: "Sentiment Agent", finding: "Fear & Greed index is at 62 (Greed). Social narrative tone is moderately bullish across top communities.", color: "#A78BFA" },
      { agent: "Market Agent", finding: "Price holding firmly above 4H 50-EMA with steady spot accumulation and declining sell volume.", color: "#FFEA93" },
      { agent: "Risk Agent", finding: "Volatility remains contained within 2.8% daily ATR. Account exposure within safe parameters.", color: "#F87171" },
    ],
    ahnaSynthesis: "Market sentiment is moderately bullish based on recent price movement, news momentum, and constructive sentiment indicators. Spot accumulation supports current levels, but monitor for resistance near $80,400 before aggressive expansion.",
    decision: "BULLISH",
    confidence: 78,
    keyLevels: {
      support: "$76,300",
      resistance: "$80,400",
      invalidation: "$74,800",
    },
  },
  {
    id: "trade_setup",
    label: "Trade Setup & Risk",
    userQuestion: "Evaluate BTC/USDT risk and trade structure on the 1H timeframe.",
    agentBreakdown: [
      { agent: "Market Agent", finding: "Bullish pennant breakout forming with expanding relative volume (1.4x 24h baseline).", color: "#FFEA93" },
      { agent: "Trade Agent", finding: "Long setup identified: Entry $77,200 - $77,600 | Target: $81,500 | R:R ratio 2.4:1.", color: "#38BDF8" },
      { agent: "Risk Agent", finding: "Recommended position size capped at 1.8% of portfolio equity. Stop-loss mandated at $75,400.", color: "#F87171" },
    ],
    ahnaSynthesis: "Valid setup with favourable 2.4:1 risk-to-reward ratio. All 5 specialist agents are in consensus. Enter within the defined value area and honor the $75,400 invalidation stop to protect capital.",
    decision: "BULLISH",
    confidence: 84,
    keyLevels: {
      support: "$76,800",
      resistance: "$81,500",
      invalidation: "$75,400",
    },
  },
  {
    id: "news_macro",
    label: "News & Catalysts",
    userQuestion: "How do recent macro headlines affect crypto market risk?",
    agentBreakdown: [
      { agent: "News Agent", finding: "FOMC policy commentary signals rate stability. 3 institutional ETF inflow reports confirmed in the last 12h.", color: "#70C891" },
      { agent: "Market Agent", finding: "No adverse volatility spike detected in order book depth. Major bids stacked at support.", color: "#FFEA93" },
      { agent: "Risk Agent", finding: "Macro risk score is Low-Medium. Keep cash reserve at minimum 15% ahead of next CPI release.", color: "#F87171" },
    ],
    ahnaSynthesis: "Macro catalysts are net positive for risk assets over the near term. Institutional inflows provide a price floor, but maintain disciplined cash reserves ahead of upcoming inflation reporting.",
    decision: "NEUTRAL",
    confidence: 72,
    keyLevels: {
      support: "$75,500",
      resistance: "$79,800",
      invalidation: "$73,900",
    },
  },
]

export default function AhnaAISection() {
  const [selectedPrompt, setSelectedPrompt] = useState<string>("sentiment")
  const [activePipelineAgent, setActivePipelineAgent] = useState<string>("synthesis")

  const currentConvo = SAMPLE_CONVERSATIONS.find((c) => c.id === selectedPrompt) ?? SAMPLE_CONVERSATIONS[0]
  const activeAgent = AGENTS_PIPELINE.find((a) => a.id === activePipelineAgent) ?? AGENTS_PIPELINE[5]

  return (
    <section id="ahna" className="relative overflow-hidden border-t border-white/10 bg-[#07111F] text-white">
      {/* Background Decorative Tech Grid & Glows */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(47,120,183,0.18),transparent_70%)]" />
      <div className="pointer-events-none absolute -left-48 top-1/3 h-96 w-96 rounded-full bg-[#70C891]/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-48 bottom-1/4 h-96 w-96 rounded-full bg-[#2F78B7]/15 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-[1380px] px-5 py-24 sm:px-8 lg:px-12 lg:py-28">
        
        {/* Section Header */}
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-[#2F78B7]/40 bg-[#2F78B7]/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-[#70C891] shadow-[0_0_20px_rgba(47,120,183,0.25)]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#70C891] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#70C891]" />
            </span>
            <span>AHNA Multi-Agent AI Financial Assistant</span>
          </div>

          <h2 className="mt-6 max-w-[920px] font-serif text-[clamp(2.8rem,5.5vw,5.6rem)] leading-[0.92] tracking-[-0.05em] text-[#FFF8E0]">
            Autonomous Specialist Agents. <br />
            <span className="bg-gradient-to-r from-[#FFEA93] via-[#70C891] to-[#38BDF8] bg-clip-text text-transparent">
              One Unified Financial Intelligence.
            </span>
          </h2>

          <p className="mt-6 max-w-[740px] text-[16px] leading-8 text-white/70 sm:text-[18px]">
            Unlike generic single-model chatbots, <strong className="text-white">AHNA</strong> coordinates a multi-agent network that continuously analyzes live market data, breaking news, market sentiment, portfolio risk limits, and structured trade setups.
          </p>

          {/* Quick Stats Badges */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-[12px] font-bold text-white/80">
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 backdrop-blur-sm">
              <Cpu className="h-4 w-4 text-[#38BDF8]" />
              <span>5 Specialized Intelligence Agents</span>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 backdrop-blur-sm">
              <ShieldCheck className="h-4 w-4 text-[#70C891]" />
              <span>Zero-Hallucination Risk Guardrails</span>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 backdrop-blur-sm">
              <Zap className="h-4 w-4 text-[#FFEA93]" />
              <span>Real-Time Evidence Synthesis</span>
            </div>
          </div>
        </div>

        {/* Multi-Agent Architecture Flow Visualizer */}
        <div className="mt-16 rounded-[28px] border border-white/12 bg-white/[0.03] p-6 backdrop-blur-xl sm:p-8 lg:p-10">
          <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#70C891]">
                <Layers className="h-4 w-4" />
                <span>Multi-Agent Architecture Flow</span>
              </div>
              <h3 className="mt-1 text-[20px] font-black tracking-[-0.02em] text-white">
                How AHNA Processes Financial Questions
              </h3>
            </div>
            <span className="text-[12px] font-medium text-white/50">
              Click any agent to inspect its role & evidence stream
            </span>
          </div>

          {/* Pipeline Stepper Nodes */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {AGENTS_PIPELINE.map((agent, idx) => {
              const Icon = agent.icon
              const isSelected = activePipelineAgent === agent.id
              const isLast = idx === AGENTS_PIPELINE.length - 1

              return (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => setActivePipelineAgent(agent.id)}
                  className={`group relative flex flex-col items-start rounded-2xl border p-4 text-left transition-all duration-300 ${
                    isSelected
                      ? `${agent.borderColor} ${agent.bgGlow} shadow-[0_0_25px_rgba(47,120,183,0.3)] ring-2 ring-[#2F78B7]/40`
                      : "border-white/10 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.05]"
                  }`}
                >
                  <div className="flex w-full items-center justify-between">
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-xl transition group-hover:scale-110"
                      style={{
                        backgroundColor: `${agent.accentColor}18`,
                        color: agent.accentColor,
                      }}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-[10px] font-black tracking-wider text-white/40">
                      0{idx + 1}
                    </span>
                  </div>

                  <span className="mt-4 text-[14px] font-black tracking-tight text-white">
                    {agent.name}
                  </span>
                  <span className="text-[11px] font-semibold" style={{ color: agent.accentColor }}>
                    {agent.role}
                  </span>

                  {/* Flow Arrow for larger screens */}
                  {!isLast && (
                    <div className="pointer-events-none absolute -right-2 top-1/2 hidden -translate-y-1/2 z-20 lg:block">
                      <span className="text-white/20">→</span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Active Agent Detail Panel */}
          <div className="mt-6 rounded-2xl border border-white/10 bg-black/40 p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3.5">
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                  style={{
                    backgroundColor: `${activeAgent.accentColor}20`,
                    color: activeAgent.accentColor,
                  }}
                >
                  <activeAgent.icon className="h-6 w-6" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-[17px] font-black text-white">{activeAgent.name}</h4>
                    <span
                      className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                      style={{
                        backgroundColor: `${activeAgent.accentColor}18`,
                        color: activeAgent.accentColor,
                      }}
                    >
                      {activeAgent.badge}
                    </span>
                  </div>
                  <p className="mt-1 text-[13px] text-white/70">{activeAgent.description}</p>
                </div>
              </div>

              <div className="shrink-0 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 sm:text-right">
                <span className="block text-[10px] font-black uppercase tracking-wider text-white/40">
                  Data Stream Inspected
                </span>
                <span className="text-[12px] font-bold text-white/90">{activeAgent.evidence}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Section: Capabilities Grid & Live Conversation Preview */}
        <div className="mt-16 grid gap-8 lg:grid-cols-12">
          
          {/* Left Column: 6 Compact Capability Cards (5 cols) */}
          <div className="flex flex-col justify-between space-y-4 lg:col-span-5">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#FFEA93]">
                <Bot className="h-4 w-4" />
                <span>Specialized Capabilities</span>
              </div>
              <h3 className="mt-1 text-[26px] font-black tracking-[-0.03em] text-white">
                Engineered for High-Conviction Decisions
              </h3>
              <p className="mt-2 text-[14px] leading-6 text-white/60">
                Every capability operates autonomously and streams its findings to AHNA before any summary is delivered.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {CAPABILITIES.map((cap) => {
                const Icon = cap.icon
                return (
                  <div
                    key={cap.title}
                    className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition duration-200 hover:border-[#2F78B7]/50 hover:bg-white/[0.06]"
                  >
                    <div className="flex items-start gap-3.5">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2F78B7]/15 text-[#38BDF8] transition group-hover:scale-105 group-hover:bg-[#2F78B7]/30">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-[15px] font-black text-white">{cap.title}</h4>
                          <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold text-white/60">
                            {cap.tag}
                          </span>
                        </div>
                        <p className="mt-1 text-[12px] leading-5 text-white/60">{cap.desc}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right Column: Interactive AHNA Conversation Terminal (7 cols) */}
          <div className="flex flex-col rounded-[28px] border border-[#2F78B7]/40 bg-[#040B14] p-6 shadow-[0_15px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:p-8 lg:col-span-7">
            {/* Terminal Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2F78B7] shadow-[0_0_15px_rgba(47,120,183,0.5)]">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-black text-white">AHNA Live Deliberation</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#70C891]/20 px-2 py-0.5 text-[10px] font-bold text-[#70C891]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#70C891]" />
                      Online
                    </span>
                  </div>
                  <span className="text-[11px] text-white/50">Multi-Agent Intelligence Preview</span>
                </div>
              </div>

              {/* Confidence Badge */}
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[12px]">
                <span className="text-white/50">Confidence:</span>
                <span className="font-black text-[#70C891]">{currentConvo.confidence}%</span>
              </div>
            </div>

            {/* Prompt Selector Tabs */}
            <div className="mt-5 flex flex-wrap gap-2">
              {SAMPLE_CONVERSATIONS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedPrompt(c.id)}
                  className={`rounded-xl px-3.5 py-1.5 text-[12px] font-bold transition-all ${
                    selectedPrompt === c.id
                      ? "bg-[#2F78B7] text-white shadow-[0_0_15px_rgba(47,120,183,0.4)]"
                      : "border border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.08] hover:text-white"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* User Query Message */}
            <div className="mt-6 flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white/80">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div className="rounded-2xl rounded-tl-none border border-white/10 bg-white/[0.06] p-4 text-[14px] font-medium text-white/90">
                <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-white/40">
                  User Question
                </span>
                &quot;{currentConvo.userQuestion}&quot;
              </div>
            </div>

            {/* Specialist Deliberation Stream */}
            <div className="mt-5 space-y-2.5 rounded-2xl border border-white/8 bg-black/40 p-4">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-white/50">
                <span className="flex items-center gap-1.5">
                  <BrainCircuit className="h-3.5 w-3.5 text-[#38BDF8]" />
                  Specialist Evidence Inspection
                </span>
                <span className="text-[10px] text-[#70C891]">Consensus Verified</span>
              </div>

              <div className="space-y-2 pt-1">
                {currentConvo.agentBreakdown.map((item) => (
                  <div
                    key={item.agent}
                    className="flex items-start gap-2.5 rounded-xl border border-white/5 bg-white/[0.02] p-2.5 text-[12px]"
                  >
                    <span
                      className="mt-0.5 h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <div>
                      <strong className="text-white/90" style={{ color: item.color }}>
                        {item.agent}:
                      </strong>{" "}
                      <span className="text-white/70">{item.finding}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AHNA Final Synthesized Response */}
            <div className="mt-5 flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#2F78B7] text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="flex-1 rounded-2xl rounded-tl-none border border-[#2F78B7]/40 bg-[#2F78B7]/10 p-4.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#38BDF8]">
                    AHNA Synthesis &amp; Trade Brief
                  </span>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-black tracking-wider ${
                      currentConvo.decision === "BULLISH"
                        ? "bg-[#70C891]/20 text-[#70C891]"
                        : "bg-[#FFEA93]/20 text-[#FFEA93]"
                    }`}
                  >
                    {currentConvo.decision}
                  </span>
                </div>

                <p className="mt-2 text-[13px] leading-6 text-white/90">
                  {currentConvo.ahnaSynthesis}
                </p>

                {/* Key Actionable Levels */}
                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/10 pt-3 text-[11px]">
                  <div className="rounded-lg bg-black/40 p-2 text-center">
                    <span className="block text-[9px] font-bold text-white/40">SUPPORT</span>
                    <strong className="text-[#70C891]">{currentConvo.keyLevels.support}</strong>
                  </div>
                  <div className="rounded-lg bg-black/40 p-2 text-center">
                    <span className="block text-[9px] font-bold text-white/40">RESISTANCE</span>
                    <strong className="text-[#FFEA93]">{currentConvo.keyLevels.resistance}</strong>
                  </div>
                  <div className="rounded-lg bg-black/40 p-2 text-center">
                    <span className="block text-[9px] font-bold text-white/40">INVALIDATION</span>
                    <strong className="text-[#F87171]">{currentConvo.keyLevels.invalidation}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Terminal Footer CTA */}
            <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-5 sm:flex-row">
              <span className="text-[12px] text-white/50">
                Want custom real-time questions answered for any crypto market?
              </span>
              <Link
                href="/intelligence"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#2F78B7] px-5 text-[13px] font-black text-white shadow-[0_0_20px_rgba(47,120,183,0.4)] transition hover:-translate-y-0.5 hover:bg-[#245F93]"
              >
                <span>Ask AHNA Live</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Prominent Call To Action Bar */}
        <div className="mt-16 rounded-[28px] border border-white/12 bg-gradient-to-r from-[#164F7D]/80 via-[#0E2F4D]/90 to-[#07111F] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:p-10">
          <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <div className="max-w-[720px]">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-[#FFEA93]">
                <Sparkles className="h-3.5 w-3.5" />
                Ready to Experience Next-Gen AI Trading
              </span>
              <h3 className="mt-2 font-serif text-[clamp(2rem,3.5vw,3.2rem)] leading-[0.95] tracking-[-0.04em] text-white">
                Stop guessing. Start trading with orchestrated multi-agent conviction.
              </h3>
              <p className="mt-3 text-[15px] leading-7 text-white/70">
                Access the full AI Intelligence workbench or simulate positions with paper trading before risking real capital.
              </p>
            </div>

            <div className="flex flex-col gap-3.5 sm:flex-row lg:shrink-0">
              <Link
                href="/intelligence"
                className="inline-flex min-h-14 items-center justify-center gap-2.5 rounded-xl bg-[#2F78B7] px-8 text-[15px] font-black !text-white shadow-[0_10px_30px_rgba(47,120,183,0.35)] transition hover:-translate-y-0.5 hover:bg-[#245F93]"
              >
                <Sparkles className="h-4 w-4" />
                <span>Try AHNA</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/paper-trading"
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[0.06] px-7 text-[15px] font-black text-white backdrop-blur-md transition hover:bg-white hover:text-black"
              >
                <span>Rehearse with Paper Capital</span>
              </Link>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
