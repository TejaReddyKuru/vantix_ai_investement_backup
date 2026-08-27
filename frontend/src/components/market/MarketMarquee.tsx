"use client"

import { useEffect, useMemo, useState } from "react"
import {
  ArrowDownRight,
  ArrowUpRight,
} from "lucide-react"

type MarketTicker = {
  symbol: string
  price: number
  change: number
}

const assets = [
  "btcusdt",
  "ethusdt",
  "solusdt",
  "bnbusdt",
  "xrpusdt",
  "dogeusdt",
  "adausdt",
  "avaxusdt",
]

const initialPrices: Record<string, number> = {
  BTCUSDT: 117842,
  ETHUSDT: 4321,
  SOLUSDT: 192.84,
  BNBUSDT: 846.21,
  XRPUSDT: 3.21,
  DOGEUSDT: 0.23,
  ADAUSDT: 0.94,
  AVAXUSDT: 31.84,
}

function formatPrice(price: number) {
  if (price >= 1000) {
    return `$${price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  if (price >= 1) {
    return `$${price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  return `$${price.toFixed(4)}`
}

function formatChange(change: number) {
  return `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`
}

export default function MarketMarquee() {
  const [markets, setMarkets] = useState<Record<string, MarketTicker>>(() =>
    Object.fromEntries(
      assets.map((asset) => {
        const key = asset.toUpperCase()

        return [
          key,
          {
            symbol: key.replace("USDT", ""),
            price: initialPrices[key] ?? 0,
            change: 0,
          },
        ]
      }),
    ),
  )

  useEffect(() => {
    let socket: WebSocket | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let stopped = false

    const connect = () => {
      if (stopped) return

      const streams = assets
        .map((asset) => `${asset}@ticker`)
        .join("/")

      socket = new WebSocket(
        `wss://stream.binance.com:9443/stream?streams=${streams}`,
      )

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data)
          const ticker = payload?.data

          if (!ticker?.s) return

          const symbol = String(ticker.s)
          const price = Number(ticker.c)
          const change = Number(ticker.P)

          if (!Number.isFinite(price) || !Number.isFinite(change)) {
            return
          }

          setMarkets((current) => ({
            ...current,
            [symbol]: {
              symbol: symbol.replace("USDT", ""),
              price,
              change,
            },
          }))
        } catch {
          // Ignore malformed exchange messages.
        }
      }

      socket.onclose = () => {
        if (!stopped) {
          reconnectTimer = setTimeout(connect, 3000)
        }
      }

      socket.onerror = () => {
        socket?.close()
      }
    }

    connect()

    return () => {
      stopped = true

      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
      }

      socket?.close()
    }
  }, [])

  const tickerItems = useMemo(() => {
    return assets.map((asset) => {
      const symbol = asset.toUpperCase()

      return (
        markets[symbol] ?? {
          symbol: symbol.replace("USDT", ""),
          price: initialPrices[symbol] ?? 0,
          change: 0,
        }
      )
    })
  }, [markets])

  /*
   * Two identical sets are required for a seamless loop.
   *
   * The track moves exactly 50% of its total width.
   * Because the second half is identical to the first half,
   * the reset is visually invisible.
   */
  const repeatedItems = [...tickerItems, ...tickerItems]

  return (
    <section
      aria-label="Global crypto markets"
      className="relative z-20 overflow-hidden border-b border-[#DAD9CD] bg-[#111D17]"
    >
      {/* Ambient top edge */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-px bg-white/[0.08]" />

      {/* Left fade */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-[#111D17] via-[#111D17]/90 to-transparent sm:w-28" />

      {/* Right fade */}
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-[#111D17] via-[#111D17]/90 to-transparent sm:w-28" />

      <div className="group overflow-hidden">
        <div
          className="flex w-max items-center py-2.5 will-change-transform"
          style={{
            animation: "market-marquee 32s linear infinite",
          }}
        >
          {repeatedItems.map((market, index) => {
            const positive = market.change >= 0

            return (
              <div
                key={`${market.symbol}-${index}`}
                className="flex shrink-0 items-center"
              >
                <div className="flex min-w-[174px] items-center gap-3 px-4 sm:min-w-[190px] sm:px-5">
                  {/* Asset badge */}
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border border-white/[0.10] bg-white/[0.055] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                    <span className="text-[8px] font-extrabold tracking-[0.04em] text-white/80">
                      {market.symbol.slice(0, 2)}
                    </span>
                  </div>

                  {/* Symbol */}
                  <div className="min-w-[46px]">
                    <div className="text-[10px] font-extrabold tracking-[0.08em] text-white/90">
                      {market.symbol}
                    </div>

                    <div className="mt-0.5 text-[7px] font-bold uppercase tracking-[0.12em] text-white/30">
                      USDT
                    </div>
                  </div>

                  {/* Price + change */}
                  <div className="ml-auto text-right">
                    <div className="text-[10px] font-extrabold tabular-nums text-white/90">
                      {formatPrice(market.price)}
                    </div>

                    <div
                      className={[
                        "mt-0.5 flex items-center justify-end gap-0.5",
                        "text-[8px] font-extrabold tabular-nums",
                        positive
                          ? "text-[#65C18C]"
                          : "text-[#E58D8D]",
                      ].join(" ")}
                    >
                      {positive ? (
                        <ArrowUpRight size={9} strokeWidth={2.5} />
                      ) : (
                        <ArrowDownRight size={9} strokeWidth={2.5} />
                      )}

                      {formatChange(market.change)}
                    </div>
                  </div>
                </div>

                <div className="h-7 w-px shrink-0 bg-white/[0.07]" />
              </div>
            )
          })}
        </div>
      </div>

      <style jsx>{`
        @keyframes market-marquee {
          from {
            transform: translate3d(0, 0, 0);
          }

          to {
            transform: translate3d(-50%, 0, 0);
          }
        }

        .group:hover > div {
          animation-play-state: paused !important;
        }

        @media (prefers-reduced-motion: reduce) {
          .group > div {
            animation: none !important;
            transform: translate3d(0, 0, 0);
          }
        }
      `}</style>
    </section>
  )
}

