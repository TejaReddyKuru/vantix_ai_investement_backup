export type User = {
  id: string
  email: string
  display_name?: string
}

export type TokenResponse = {
  user: User
  tokens: {
    access_token: string
    refresh_token: string
    token_type: string
    expires_in: number
    refresh_expires_in: number
  }
}

export type Asset = {
  symbol: string
  name: string
  price: number
  change24h: number
  volume24h?: number
}

export type PortfolioSummary = {
  total_value: number
  todays_pl: number
  total_pl: number
  return_pct: number
  available_balance: number
  invested_capital: number
}
