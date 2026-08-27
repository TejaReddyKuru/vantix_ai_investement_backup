import type { Metadata } from "next"
import "./globals.css"
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
    <html lang="en">
      <body className="min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
