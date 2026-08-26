import Link from "next/link"
import CoinCrestBrand, {
  CoinCrestMark,
  CoinCrestWordmark,
} from "../branding/CoinCrestBrand"

export default function SiteFooter() {
  return (
    <footer className="bg-black text-white">
      <div className="mx-auto max-w-[1380px] px-5 pb-8 pt-20 sm:px-8 lg:px-12">
        <div className="grid gap-12 border-b border-white/16 pb-16 lg:grid-cols-[1.15fr_0.85fr]">
          <h2 className="font-serif text-[clamp(3.4rem,6vw,6.8rem)] leading-[0.86] tracking-[-0.06em] text-[#FFEA93]">
            Trade what you see.<br />Understand what you risk.
          </h2>
          <p className="max-w-[650px] self-end text-[18px] leading-8 text-white/62 lg:justify-self-end">
            CoinCrest brings market context, rehearsal, and execution discipline into one deliberate crypto trading workspace.
          </p>
        </div>

        <div className="grid gap-12 border-b border-white/16 py-14 md:grid-cols-[1.4fr_0.6fr_0.6fr_0.6fr]">
          <div>
            <CoinCrestBrand inverted />
            <p className="mt-5 max-w-[350px] text-[15px] leading-7 text-white/50">
              AI-assisted market intelligence designed to make evidence and risk easier to inspect.
            </p>
          </div>
          <div>
            <h3 className="text-[12px] font-black uppercase tracking-[0.16em] text-[#8DB355]">Product</h3>
            <div className="mt-5 flex flex-col gap-4 text-[15px] text-white/70">
              <Link href="/#platform" className="hover:text-white">Platform</Link>
              <Link href="/#ahna" className="hover:text-white">AHNA</Link>
              <Link href="/risk" className="hover:text-white">Risk</Link>
            </div>
          </div>
          <div>
            <h3 className="text-[12px] font-black uppercase tracking-[0.16em] text-[#8DB355]">Company</h3>
            <div className="mt-5 flex flex-col gap-4 text-[15px] text-white/70">
              <Link href="/about" className="hover:text-white">About</Link>
              <Link href="/terms" className="hover:text-white">Terms</Link>
            </div>
          </div>
          <div>
            <h3 className="text-[12px] font-black uppercase tracking-[0.16em] text-[#8DB355]">Access</h3>
            <div className="mt-5 flex flex-col gap-4 text-[15px] text-white/70">
              <Link href="/login" className="hover:text-white">Sign in</Link>
              <Link href="/register" className="hover:text-white">Create account</Link>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5 border-b border-white/16 py-7 text-[12px] leading-5 text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>Crypto assets are volatile and involve substantial risk. CoinCrest does not provide investment advice.</p>
          <p>Market values displayed on this page are illustrative.</p>
        </div>

        <div className="flex flex-col items-start justify-between gap-10 pt-12 sm:flex-row sm:items-end">
          <div className="flex items-center gap-5">
            <CoinCrestMark className="h-24 w-24 sm:h-32 sm:w-32" inverted />
            <CoinCrestWordmark className="text-[clamp(2.8rem,7vw,7.5rem)]" inverted />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">
            © 2026 CoinCrest · Trade smarter. Rise higher.
          </p>
        </div>
      </div>
    </footer>
  )
}
