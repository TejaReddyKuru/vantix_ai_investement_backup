import { ASSETS, normalizeSymbol } from "./market-data";
export function workstationHref(
  symbol = "BTC",
  options: { analyze?: boolean; mode?: "paper" | "live" } = {},
): string {
  const params = new URLSearchParams({ symbol: normalizeSymbol(symbol) });
  if (options.analyze && normalizeSymbol(symbol) !== "USDT")
    params.set("analyze", "1");
  if (options.mode) params.set("mode", options.mode);
  return `/paper-trading?${params.toString()}`;
}
export function apiSymbol(symbol: string): string | null {
  const found = ASSETS.find((asset) => asset.symbol === symbol);
  return found && found.symbol !== "USDT" ? `${found.symbol}USDT` : null;
}
export function safeReturnPath(value: string | null): string {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\u0000-\u0020]/.test(value)
  )
    return "/dashboard";
  try {
    const url = new URL(value, "https://coincrest.local");
    const allowed = [
      "/dashboard",
      "/markets",
      "/paper-trading",
      "/portfolio",
      "/intelligence",
      "/risk",
      "/journal",
      "/community",
      "/settings",
      "/notifications",
    ];
    if (
      url.origin !== "https://coincrest.local" ||
      !allowed.includes(url.pathname)
    )
      return "/dashboard";
    return url.pathname + url.search + url.hash;
  } catch {
    return "/dashboard";
  }
}
