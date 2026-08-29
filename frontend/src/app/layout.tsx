import type { Metadata } from "next"
import "./globals.css"
import "./theme-adaptive.css"
import "./theme.css"
import "./product-v4.css"
import "./product-v5.css"
import "./premium-v9.css"
import Providers from "../providers"

export const metadata: Metadata = {
  title: {
    default: "CoinCrest — Trade Smarter. Rise Higher.",
    template: "%s | CoinCrest",
  },
  description:
    "AI-assisted crypto market intelligence, portfolio analytics, risk management and paper trading powered by AHNA.",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: "try{var t=localStorage.getItem('coincrest:theme');document.documentElement.dataset.theme=t==='dark'||t==='light'?t:matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}catch(e){document.documentElement.dataset.theme='light'}" }} /></head>
      <body className="min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
