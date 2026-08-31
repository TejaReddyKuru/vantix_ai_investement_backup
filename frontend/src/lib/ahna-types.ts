export type AHNAMarketState = {
  price: number;
  price_change_24h: number | null;
  volume_24h: number | null;
  rsi: number | null;
  macd: number | null;
  ema20: number | null;
  ema50: number | null;
  market_regime: string;
  volatility: string;
  liquidity: string;
};

export type AHNAInstruction = {
  title: string;
  message: string;
  action: string;
  watch_conditions: string[];
};

export type AHNATradePlan = {
  entry_min: number | null;
  entry_max: number | null;
  stop_loss: number | null;
  take_profit: number | null;
  risk_reward: number | null;
};

export type AHNAUIEffect = {
  mode: string;
  highlight: string;
  animate_chart: boolean;
  show_entry_zone: boolean;
};

export type AHNAAnalysisResponse = {
  symbol: string;
  decision: string;
  confidence: number;
  market_view: string;
  risk_level: string;
  summary: string;
  reasoning: string[];
  entry: { min: number; max: number } | null;
  stop_loss: number | null;
  take_profit: number[] | null;
  warnings: string[];
  
  market_regime: string | null;
  market_state: AHNAMarketState | null;
  instruction: AHNAInstruction | null;
  watch_conditions: string[] | null;
  trade_plan: AHNATradePlan | null;
  ui_effect: AHNAUIEffect | null;
};
