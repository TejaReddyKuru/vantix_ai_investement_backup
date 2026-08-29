import { isRecord } from "./market-data";
import { safeArticleUrl, type NewsArticle } from "./workspace-data";
import { AGENTS, type Unified } from "./terminal-account";
import { SUGGESTED_ASSETS } from "./asset-directory";
export type AgentKey = typeof AGENTS[number]["key"];
export function record(value: unknown): Record<string, unknown> { return isRecord(value) ? value : {}; }
function text(value: unknown): string | null { return typeof value === "string" && value.trim() ? value.slice(0, 1500) : null; }
export function confidence(value: unknown): number | null {
  if (typeof value !== "number" && !(typeof value === "string" && /^\d+(?:\.\d+)?$/.test(value))) return null;
  const number = Number(value); return Number.isFinite(number) && number >= 0 && number <= 1 ? number : null;
}
export function signalOf(value: unknown): string | null {
  const row = record(value), signal = record(row.signal);
  const valueText = text(signal.signal) ?? text(row.signal) ?? text(row.direction) ?? text(row.sentiment_direction) ?? text(row.trend_direction);
  return valueText?.slice(0, 80) ?? null;
}
export function confidenceOf(value: unknown): number | null {
  const row = record(value); return confidence(row.confidence ?? record(row.signal).confidence ?? row.sentiment_confidence);
}
export function reasonsOf(value: unknown): string[] {
  const row = record(value), signal = record(row.signal);
  const parts = [row.reasons, signal.reasons, row.warnings, row.rationale, row.summary, row.rejection_reason];
  return [...new Set(parts.flatMap(part => Array.isArray(part) ? part.flatMap(v => text(v) ? [text(v)!] : []) : text(part) ? [text(part)!] : []))].slice(0, 12);
}
export function evidenceFields(value: unknown, prefix = "", depth = 0): { label: string; value: string }[] {
  if (!isRecord(value) || depth > 4) return [];
  return Object.entries(value).flatMap(([key, item]) => {
    if (/(?:^|_)(?:id|token|secret|password|credential|api_key|chain_of_thought|thoughts|private_reasoning)(?:$|_)/i.test(key)) return [];
    const label = `${prefix}${key}`.replaceAll("_", " ");
    if (typeof item === "string") return [{ label, value: item.slice(0, 800) }];
    if (typeof item === "number" && Number.isFinite(item)) return [{ label, value: String(item) }];
    if (typeof item === "boolean") return [{ label, value: item ? "Yes" : "No" }];
    if (Array.isArray(item) && item.every(v => typeof v === "string" || typeof v === "number")) return [{ label, value: item.slice(0, 12).join(" · ").slice(0, 1800) }];
    return evidenceFields(item, `${label} / `, depth + 1);
  }).slice(0, 60);
}
export function newsFromUnified(data: Unified | undefined): NewsArticle[] {
  if (!data || !Array.isArray(data.outputs.news)) return [];
  const seen = new Set<string>();
  return data.outputs.news.flatMap(item => {
    const row = record(item), url = safeArticleUrl(row.url);
    if (!url || seen.has(url) || !text(row.title) || !text(row.source) || /\b(mock|demo|sample|test)\b/i.test(String(row.source)) || (row.symbol != null && row.symbol !== data.symbol) || typeof row.published_at !== "string" || !Number.isFinite(Date.parse(row.published_at)) || Date.parse(row.published_at) > Date.now() + 300000) return [];
    seen.add(url);
    return [{ id: url, url, title: String(row.title).slice(0, 350), source: String(row.source).slice(0, 100), description: text(row.description) ?? "", published_at: row.published_at, symbol: data.symbol }];
  }).sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at)).slice(0, 20);
}
export function hasEvidence(value: unknown): boolean { return Array.isArray(value) ? value.length > 0 : isRecord(value) && Object.keys(value).length > 0; }
export const AGENT_GUIDES: Record<AgentKey, { task: string; next: string; caution: string }> = {
  technical_analysis: { task: "Inspect trend, momentum, volatility and nearby levels.", next: "Compare the signal with its supporting indicators and candle timestamp. Identify what would invalidate the setup.", caution: "Indicators describe price history; they do not guarantee the next move." },
  news: { task: "Review reported events and the original publications.", next: "Open the source, check publication time and compare the event with price and volume. Separate a headline from a confirmed catalyst.", caution: "A news item alone does not establish a buy or sell setup." },
  sentiment: { task: "Measure the tone of the news the service actually received.", next: "Compare news tone with the technical view. Disagreement is a reason to investigate, not an automatic trade.", caution: "News sentiment is not a survey of all traders or a probability of profit." },
  market_intelligence: { task: "Combine signals and disclose disagreement between inputs.", next: "Read the reasons and divergence flag before relying on the headline signal.", caution: "Backend confidence is a model score, not a calibrated win rate." },
  portfolio_snapshot: { task: "Inspect the account context supplied to the pipeline.", next: "Check the account and recorded timestamp before comparing exposure with your plan.", caution: "This is backend account context, not a verified live broker balance." },
  risk_assessment: { task: "Inspect returned risk constraints, warnings and rejection reasons.", next: "Review each warning and your proposed loss before any execution step.", caution: "A returned approval is an analytical risk result, not permission to execute a live order." },
};
export type EvidenceIntent = "brief" | "news" | "risk" | "explain" | "unsupported";
export function otherMentionedAsset(question: string, activeSymbol: string) {
  return SUGGESTED_ASSETS.find(asset => {
    if (asset.symbol === activeSymbol) return false;
    const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const name = asset.name.replace(/ \(.*\)$/, "");
    const nameMatch = name.toUpperCase() !== asset.symbol && new RegExp(`\\b${escape(name)}\\b`, "i").test(question);
    const symbolMatch = new RegExp(`\\b${escape(asset.symbol)}\\b`, asset.symbol === "LINK" ? "" : "i").test(question);
    return nameMatch || symbolMatch || (asset.symbol === "USDC" && /\busd\s+coin\b/i.test(question));
  });
}
export function questionIntent(question: string): EvidenceIntent {
  if (/\b(news|headline|event|catalyst)\b/i.test(question)) return "news";
  if (/\b(risk|stop|loss|exposure|portfolio|safe|drawdown)\b/i.test(question)) return "risk";
  if (/\b(why|explain|confidence|indicator|rsi|macd|teach|evidence)\b/i.test(question)) return "explain";
  if (/\b(brief|market|price|outlook|trend|summari[sz]e|analysis|analy[sz]e|buy|sell|trade|bitcoin|btc|eth|sol)\b/i.test(question)) return "brief";
  return "unsupported";
}
export function evidenceReply(intent: EvidenceIntent, data: Unified | undefined): string {
  if (intent === "unsupported") return "I’m in evidence mode, not connected to a conversational model. I can assemble a market brief, news review, risk check, or explain the returned evidence for the selected asset.";
  if (!data) return "I don’t have agent results for this market yet. I can show an available quote, but I can’t infer a signal, risk assessment, or forecast from missing analysis.";
  const market = data.outputs.market_intelligence, signal = signalOf(market) ?? signalOf(data.outputs.technical_analysis);
  if (intent === "news") return `The news section below contains the publisher links returned for ${data.symbol}. Use publication times and the separate sentiment output to evaluate relevance; the interface does not invent a trade recommendation from a headline.`;
  if (intent === "risk") return "Here are the pipeline’s portfolio and risk findings. They are account-context checks, not live-broker balances or order permissions. Missing risk output means no assessment is available.";
  if (intent === "explain") return "Expand each agent’s evidence to see its returned inputs, reasons and measurements. Confidence is the backend’s own score—not a win-rate prediction. The review prompts are general guidance, separate from agent findings.";
  return signal ? `The backend’s current analytical signal is ${signal} for ${data.symbol}. Review the reasons, missing evidence and timestamps below; this is not an instruction to place an order.` : `The pipeline returned a partial brief for ${data.symbol}, without a usable headline signal. The individual results below show what is available.`;
}
