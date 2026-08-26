import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import CoinCrestBrand from "../../components/branding/CoinCrestBrand"
import SiteFooter from "../../components/landing/SiteFooter"

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description: "CoinCrest terms and conditions.",
}

const sections = [
  {
    title: "1. Acceptance of these terms",
    body: "By accessing or using CoinCrest, you agree to these Terms and our Privacy Policy. If you do not agree, do not use the service. You must be legally capable of entering a binding agreement in your jurisdiction.",
  },
  {
    title: "2. Product scope",
    body: "CoinCrest provides software for market research, analytics, AI-assisted information, portfolio monitoring, journaling, alerts, and simulated paper trading. Features may be added, changed, suspended, or removed as the product develops.",
  },
  {
    title: "3. No investment, legal, or tax advice",
    body: "CoinCrest and AHNA do not provide personalized investment, financial, legal, accounting, or tax advice. Outputs are general information and educational decision support. Nothing on the service is an offer, solicitation, recommendation, guarantee, or instruction to buy, sell, or hold any asset.",
  },
  {
    title: "4. AI limitations",
    body: "AI-generated content may be incomplete, delayed, inconsistent, or wrong. Agent confidence and explanations do not guarantee accuracy. You must independently verify material information and exercise your own judgment before acting.",
  },
  {
    title: "5. Market risk",
    body: "Crypto assets are highly volatile and may lose substantial or all value. Markets may be illiquid, manipulated, interrupted, or affected by regulatory and technical events. You are solely responsible for your decisions, orders, taxes, losses, and compliance obligations.",
  },
  {
    title: "6. Paper trading",
    body: "Paper-trading results are simulations. They may not reflect latency, liquidity, fees, slippage, execution quality, emotional pressure, or other live-market conditions. Simulated performance is not evidence of future results.",
  },
  {
    title: "7. Account security and acceptable use",
    body: "You must provide accurate information, protect your credentials, and promptly report suspected unauthorized access. You may not abuse the service, interfere with its operation, reverse engineer protected components, evade controls, scrape without permission, or use CoinCrest for unlawful or manipulative activity.",
  },
  {
    title: "8. Third-party data and services",
    body: "Market data, news, exchange connections, links, and other third-party services remain subject to their own terms and availability. CoinCrest does not control and is not responsible for third-party accuracy, outages, conduct, or losses.",
  },
  {
    title: "9. Intellectual property",
    body: "CoinCrest, AHNA, the CoinCrest mark, software, interfaces, content, and related intellectual property are owned by CoinCrest or its licensors. Except for the limited right to use the service under these Terms, no rights are transferred to you.",
  },
  {
    title: "10. Availability and termination",
    body: "The service is provided on an as-available basis. We may limit, suspend, or terminate access to protect users, the product, or third parties; address legal or security requirements; or respond to a breach of these Terms.",
  },
  {
    title: "11. Disclaimers and limitation of liability",
    body: "To the maximum extent permitted by law, CoinCrest is provided without warranties of uninterrupted availability, accuracy, fitness for a particular purpose, or non-infringement. CoinCrest and its contributors will not be liable for indirect, incidental, special, consequential, exemplary, trading, data, opportunity, or profit losses arising from use of or inability to use the service.",
  },
  {
    title: "12. Changes and contact",
    body: "We may update these Terms as the product or law changes. The updated version will be posted with a revised effective date. Continued use after an update means you accept the revised Terms. Add your official support and legal contact details here before production launch.",
  },
]

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#FFFCF5] text-black">
      <header className="border-b border-black/10">
        <div className="mx-auto flex h-[82px] max-w-[1080px] items-center justify-between px-5 sm:px-8">
          <Link href="/"><CoinCrestBrand /></Link>
          <Link href="/" className="inline-flex items-center gap-2 text-[13px] font-bold"><ArrowLeft className="h-4 w-4" /> Home</Link>
        </div>
      </header>

      <section className="border-b border-black/80 bg-[#F4E7B2]">
        <div className="mx-auto max-w-[1080px] px-5 py-20 sm:px-8 lg:py-24">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#D90000]">Legal</p>
          <h1 className="mt-5 font-serif text-[clamp(3.7rem,8vw,7.5rem)] leading-[0.86] tracking-[-0.06em]">Terms and Conditions</h1>
          <p className="mt-7 text-[14px] font-bold text-black/55">Effective date: 26 August 2026</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1080px] gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[0.34fr_0.66fr]">
        <aside className="lg:sticky lg:top-10 lg:self-start">
          <p className="text-[16px] font-black">Read before using CoinCrest.</p>
          <p className="mt-4 text-[14px] leading-6 text-black/52">This product text is a strong operational draft. Have qualified counsel review it for your company, jurisdiction, data practices, and commercial model before launch.</p>
        </aside>
        <div className="border-t border-black">
          {sections.map((section) => (
            <article key={section.title} className="border-b border-black/15 py-7">
              <h2 className="text-[21px] font-black tracking-[-0.025em]">{section.title}</h2>
              <p className="mt-4 text-[15px] leading-7 text-black/60">{section.body}</p>
            </article>
          ))}
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
