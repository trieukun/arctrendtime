export type Horizon = '15m' | '1h' | '1d' | '1w' | '1m'
export const HORIZONS: Horizon[] = ['15m', '1h', '1d', '1w', '1m']
export const HORIZON_LABEL: Record<Horizon, string> = {
  '15m': '15 phút',
  '1h': '1 giờ',
  '1d': '24 giờ',
  '1w': '1 tuần',
  '1m': '1 tháng',
}

export const HORIZON_SHORT: Record<Horizon, string> = {
  '15m': '15 phút',
  '1h': '1 giờ',
  '1d': '24 giờ',
  '1w': '1 tuần',
  '1m': '1 tháng',
}

export type Direction = 'up' | 'down' | 'flat'

export interface Forecast {
  dir: Direction
  /** 50-80, độ tin cậy của mô hình (không phải xác suất thực) */
  confidence: number
  /** Biên độ kỳ vọng theo %, có dấu */
  movePct: number
  reason: string
}

export type ForecastMap = Record<Horizon, Forecast>

export type AssetId = 'btc' | 'gold' | 'oil'
export type ImpactKey = 'btc' | 'crypto' | 'gold' | 'oil' | 'rates'

export interface WorldAsset {
  id: AssetId
  name: string
  symbol: string
  price: number
  unit: string
  changePct24h: number
  series: number[]
  forecasts: ForecastMap
  extra?: { label: string; value: string }[]
}

export interface NewsItem {
  title: string
  source: string
  url: string
  publishedAt: string
  topic: string
  tone: 'good' | 'bad' | 'neutral'
  impacts: Partial<Record<ImpactKey, number>>
}

export interface FedInfo {
  asOf: string
  targetRange: string
  lastDecision: string
  vote: string
  chair: string
  nextMeeting: string
  marketPricing: string
  inflation: string
  outlook: string[]
  sources: { label: string; url: string }[]
  us10y: number | null
  us13w: number | null
  dxy: number | null
}

export interface WorldData {
  updatedAt: string
  assets: WorldAsset[]
  news: { good: NewsItem[]; bad: NewsItem[]; other: NewsItem[] }
  fed: FedInfo
  warnings: string[]
}

export interface GoldRow {
  id: string
  name: string
  note: string
  buy: number | null
  sell: number | null
  buyChange: number | null
  sellChange: number | null
  source: string
  forecasts: ForecastMap
}

export interface FuelRow {
  id: string
  name: string
  region1: number
  region2: number | null
  changeLastAdjust: number | null
  forecasts: ForecastMap
}

export interface VnData {
  updatedAt: string
  gold: GoldRow[]
  fuel: FuelRow[]
  fuelSource: string
  lastFuelAdjust: string
  nextFuelAdjust: string
  usdVnd: number | null
  sjcPremiumPct: number | null
  worldGoldUsd: number | null
  warnings: string[]
}

export interface DepositRow {
  term: string
  counter: string
  online: string
}

export interface BankLoan {
  unsecured: string
  mortgage: string
  overdraft: string
}

export interface BankInfo {
  id: string
  name: string
  deposits: DepositRow[]
  loans: BankLoan
  depositSource: string
  depositAsOf: string
  loanSource: string
  live: boolean
  notes: string[]
}

export interface BanksData {
  updatedAt: string
  banks: BankInfo[]
  warnings: string[]
}

export interface HeadlinesData {
  updatedAt: string
  items: NewsItem[]
}
