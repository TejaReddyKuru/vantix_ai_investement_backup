export const COMMUNITY_CHANNELS = [
  { id: "announcements", name: "announcements", group: "Start here", description: "Product updates and notices from the CoinCrest team.", asset: "BTC", readOnly: true },
  { id: "market-chat", name: "market-chat", group: "Markets", description: "Discuss the market, compare evidence, and challenge the thesis.", asset: "BTC", readOnly: false },
  { id: "bitcoin", name: "bitcoin", group: "Markets", description: "Bitcoin setups, market structure, and the levels that matter.", asset: "BTC", readOnly: false },
  { id: "ethereum", name: "ethereum", group: "Markets", description: "Ethereum ideas, ecosystem news, and trading context.", asset: "ETH", readOnly: false },
  { id: "solana", name: "solana", group: "Markets", description: "Solana market discussion and evidence-led trade ideas.", asset: "SOL", readOnly: false },
  { id: "market-news", name: "market-news", group: "Markets", description: "Bring the source, timestamp, and the market relevance.", asset: "BTC", readOnly: false },
  { id: "risk-desk", name: "risk-desk", group: "Learning", description: "Position sizing, invalidation, and learning to protect capital.", asset: "BTC", readOnly: false },
  { id: "trade-journal", name: "trade-journal", group: "Learning", description: "Review decisions and lessons, not only the outcome.", asset: "BTC", readOnly: false },
] as const;
export type CommunityChannel = typeof COMMUNITY_CHANNELS[number];
export type CommunityDraft = { asset: string; title: string; thesis: string; savedAt: string | null };
export function parseCommunityDraft(value: unknown, asset = "BTC"): CommunityDraft {
  const data = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return {
    asset: typeof data.asset === "string" && /^[A-Z0-9]{1,12}$/.test(data.asset) ? data.asset : asset,
    title: typeof data.title === "string" ? data.title.slice(0, 120) : "",
    thesis: typeof data.thesis === "string" ? data.thesis.slice(0, 5000) : "",
    savedAt: typeof data.savedAt === "string" && Number.isFinite(Date.parse(data.savedAt)) ? data.savedAt : null,
  };
}
