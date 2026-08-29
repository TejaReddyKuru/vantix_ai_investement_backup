"use client";
import { useState } from "react";
import { safeCoinImage } from "@/lib/asset-directory";
const local = new Set(["BTC", "ETH", "SOL", "BNB", "XRP", "ADA", "AVAX", "LINK", "DOGE", "USDT"]);
export default function CoinIcon({ symbol, image, size = 32 }: { symbol: string; image?: string | null; size?: number }) {
  const [failed, setFailed] = useState<string | null>(null);
  const source = safeCoinImage(image) ?? (local.has(symbol) ? `/crypto/${symbol.toLowerCase()}.png` : null);
  return source && failed !== source ? <img src={source} width={size} height={size} alt="" className="cc-coin-icon" loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(source)} /> : <span className="cc-coin-monogram" style={{ width: size, height: size }} aria-hidden="true">{symbol.slice(0, 3)}</span>;
}
