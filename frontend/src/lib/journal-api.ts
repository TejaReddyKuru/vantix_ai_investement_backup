import { apiClient as api } from './client';

export interface JournalObservation {
  id: string;
  journal_entry_id: string;
  user_id: string;
  text: string;
  created_at: string;
}

export interface TradeJournalEntry {
  id: string;
  user_id: string;
  paper_account_id?: string;
  paper_trade_id?: string;
  symbol?: string;
  side?: string;
  status?: string;
  entry_price?: number;
  exit_price?: number;
  quantity?: number;
  realized_pnl?: number;
  return_percentage?: number;
  duration_seconds?: number;
  entry_timestamp?: string;
  exit_timestamp?: string;
  title?: string;
  notes?: string;
  strategy?: string;
  setup?: string;
  lessons?: string;
  tags?: string;
  market_condition?: string;
  entry_reason?: string;
  trade_thesis?: string;
  confidence?: number;
  what_went_well?: string;
  what_went_wrong?: string;
  discipline_score?: number;
  trade_plan_snapshot?: any;
  ahna_snapshot?: any;
  observations?: JournalObservation[];
  created_at: string;
  updated_at: string;
}

export interface JournalAnalytics {
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate: number;
  total_pnl: number;
  average_return: number;
  best_trade: TradeJournalEntry | null;
  worst_trade: TradeJournalEntry | null;
  monthly_return: number;
  monthly_target: number;
  strategy_breakdown: any[];
  asset_breakdown: any[];
  discipline_score: number;
}

export async function fetchJournalEntries(
  page: number = 1,
  pageSize: number = 25,
  status?: string,
  symbol?: string,
  strategy?: string
): Promise<{ page: number; page_size: number; total: number; items: TradeJournalEntry[] }> {
  const params: any = { page, page_size };
  if (status) params.status = status;
  if (symbol) params.symbol = symbol;
  if (strategy) params.strategy = strategy;
  
  const response = await api.get('/api/v1/journal', { params });
  return response.data;
}

export async function fetchJournalAnalytics(): Promise<JournalAnalytics> {
  const response = await api.get('/api/v1/journal/analytics');
  return response.data;
}

export async function addJournalObservation(entryId: string, text: string): Promise<JournalObservation> {
  const response = await api.post(`/api/v1/journal/${entryId}/observations`, { text });
  return response.data;
}
