// Contracts verified against the supplied coincrest-openapi.json (2026-08-27).
// /portfolio/summary is PAPER ONLY. /execution/analytics has no mode or currency
// contract, so it must not be used as the user's real-money balance.
export type PaperAccount = {
  id: string;
  user_id: string;
  name: string;
  current_cash: string;
  initial_balance: string;
  currency: string;
  status: string;
  updated_at: string;
};
export type PaperSummary = {
  user_id: string;
  total_equity: string | null;
  cash: string | null;
  invested_value: string | null;
  realized_pnl: string | null;
  unrealized_pnl: string | null;
};
export type BrokerConnection = {
  id?: string;
  user_id: string;
  broker: string;
  environment: string;
  status: string;
  last_verified_at?: string;
};
export type NewsArticle = {
  id: string;
  source: string;
  title: string;
  description: string;
  url: string;
  published_at: string;
  symbol: string;
};
export type NotificationRecord = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  read_at: string | null;
  created_at: string;
};
export type Intelligence = {
  symbol: string;
  timestamp: string | null;
  signal: string;
  confidence: number;
  technical_signal: string;
  sentiment_direction: string;
  trend_direction: string;
  divergence_detected: boolean;
  reasons: string[];
};

export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Unexpected response format.");
  return value as Record<string, unknown>;
}
function string(value: unknown): string {
  if (typeof value !== "string" || !value.trim())
    throw new Error("Incomplete response.");
  return value;
}
export function decimal(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const strValue = String(value);
  if (!/^[+-]?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(strValue))
    throw new Error("Invalid monetary amount.");
  if (
    !Number.isFinite(Number(strValue)) ||
    Math.abs(Number(strValue)) > Number.MAX_SAFE_INTEGER / 100
  )
    throw new Error("Amount is outside display precision.");
  return strValue;
}
function owned(value: Record<string, unknown>, userId: string) {
  if (value.user_id !== userId)
    throw new Error("Account response does not match the signed-in user.");
}
export function parsePaperAccount(
  value: unknown,
  userId: string,
): PaperAccount {
  const row = object(value);
  owned(row, userId);
  const cash = decimal(row.current_cash),
    initial = decimal(row.initial_balance);
  if (cash === null || initial === null)
    throw new Error("Paper-account balance is missing.");
  const currency = string(row.currency);
  if (!/^[A-Z0-9]{2,10}$/.test(currency))
    throw new Error("Unknown account currency.");
  return {
    id: string(row.id),
    user_id: userId,
    name: string(row.name),
    current_cash: cash,
    initial_balance: initial,
    currency,
    status: string(row.status),
    updated_at: string(row.updated_at),
  };
}
export function parsePaperSummary(
  value: unknown,
  userId: string,
): PaperSummary {
  const row = object(value);
  owned(row, userId);
  return {
    user_id: userId,
    total_equity: decimal(row.total_equity),
    cash: decimal(row.cash),
    invested_value: decimal(row.invested_value),
    realized_pnl: decimal(row.realized_pnl),
    unrealized_pnl: decimal(row.unrealized_pnl),
  };
}
export function parseBrokers(
  value: unknown,
  userId: string,
): BrokerConnection[] {
  if (!Array.isArray(value)) throw new Error("Invalid broker response.");
  return value.map((item) => {
    const row = object(item);
    owned(row, userId);
    return {
      id: typeof row.id === "string" ? row.id : undefined,
      user_id: userId,
      broker: string(row.broker),
      environment: string(row.environment),
      status: typeof row.status === "string" ? row.status : "UNKNOWN",
      last_verified_at:
        typeof row.last_verified_at === "string"
          ? row.last_verified_at
          : undefined,
    };
  });
}
export function safeArticleUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    if (
      !["https:", "http:"].includes(url.protocol) ||
      url.username ||
      url.password
    )
      return null;
    if (
      /^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[(?:::|fc|fd|fe80))/.test(url.hostname) ||
      /(^|\.)(example\.(com|org|net)|invalid|test)$/.test(url.hostname)
    )
      return null;
    return url.href;
  } catch {
    return null;
  }
}
export function parseNews(value: unknown, symbol: string): NewsArticle[] {
  const body = object(value);
  if (body.symbol !== symbol || !Array.isArray(body.articles))
    throw new Error("News response does not match this market.");
  const seen = new Set<string>();
  return body.articles
    .flatMap((item) => {
      const row = object(item),
        url = safeArticleUrl(row.url);
      if (
        !url ||
        row.symbol !== symbol ||
        typeof row.source !== "string" ||
        /\b(mock|demo|sample|test)\b/i.test(row.source) ||
        typeof row.title !== "string" ||
        typeof row.published_at !== "string" ||
        !Number.isFinite(Date.parse(row.published_at)) ||
        Date.parse(row.published_at) > Date.now() + 300000 ||
        seen.has(url)
      )
        return [];
      seen.add(url);
      return [
        {
          id: typeof row.id === "string" ? row.id : url,
          source: row.source,
          title: row.title,
          description:
            typeof row.description === "string" ? row.description : "",
          url,
          published_at: row.published_at,
          symbol,
        },
      ];
    })
    .sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at));
}
export function parseNotifications(
  value: unknown,
  userId: string,
): { items: NotificationRecord[]; total: number } {
  const body = object(value);
  if (
    !Array.isArray(body.items) ||
    typeof body.total !== "number" ||
    !Number.isSafeInteger(body.total) ||
    body.total < 0
  )
    throw new Error("Invalid notifications response.");
  const items = body.items.map((item) => {
    const row = object(item);
    owned(row, userId);
    return {
      id: string(row.id),
      user_id: userId,
      type: string(row.type),
      title: string(row.title),
      message: string(row.message),
      read_at: typeof row.read_at === "string" ? row.read_at : null,
      created_at: string(row.created_at),
    };
  });
  return { items, total: body.total };
}
export function parseIntelligence(
  value: unknown,
  symbol: string,
): Intelligence {
  const row = object(value);
  if (
    row.symbol !== symbol ||
    typeof row.confidence !== "number" ||
    !Number.isFinite(row.confidence) ||
    row.confidence < 0 ||
    row.confidence > 1 ||
    typeof row.timestamp !== "number" ||
    !Number.isFinite(new Date(row.timestamp).getTime()) ||
    !Array.isArray(row.reasons) ||
    row.reasons.some((reason) => typeof reason !== "string")
  )
    throw new Error("Incomplete analysis response.");
  return {
    symbol,
    timestamp:
      typeof row.timestamp === "number" && Number.isFinite(row.timestamp)
        ? new Date(row.timestamp).toISOString()
        : null,
    signal: string(row.signal),
    confidence: row.confidence,
    technical_signal: string(row.technical_signal),
    sentiment_direction: string(row.sentiment_direction),
    trend_direction: string(row.trend_direction),
    divergence_detected: row.divergence_detected === true,
    reasons: row.reasons as string[],
  };
}
export function accountAmount(
  value: string | null | undefined,
  currency: string | undefined,
): string {
  if (value === null || value === undefined || !currency) return "—";
  return `${Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}
export function dateLabel(value: string | null | undefined): string {
  if (!value || !Number.isFinite(Date.parse(value))) return "Time unavailable";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
