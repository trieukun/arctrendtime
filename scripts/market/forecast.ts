import type { Direction, Forecast, ForecastMap, Horizon } from '../../src/types/market'
import { getJson } from './http'

interface YahooChart {
  chart: {
    result?: {
      meta: { regularMarketPrice: number; chartPreviousClose?: number }
      timestamp?: number[]
      indicators: { quote: { close: (number | null)[] }[] }
    }[]
  }
}

export interface Series {
  closes: number[]
  price: number
}

export async function fetchSeries(symbol: string, interval: string, range: string): Promise<Series> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`
  const data = await getJson<YahooChart>(url)
  const r = data.chart.result?.[0]
  if (!r) throw new Error(`Không có dữ liệu ${symbol}`)
  const closes = (r.indicators.quote[0]?.close ?? []).filter((v): v is number => typeof v === 'number' && v > 0)
  if (closes.length < 5) throw new Error(`Dữ liệu ${symbol} quá ít`)
  return { closes, price: r.meta.regularMarketPrice }
}

interface HorizonCfg {
  interval: string
  range: string
  lookback: number
  steps: number
  newsWeight: number
  span: string
}

export const HORIZON_CFG: Record<Horizon, HorizonCfg> = {
  '15m': { interval: '5m', range: '1d', lookback: 12, steps: 3, newsWeight: 0.1, span: '1 giờ qua' },
  '1h': { interval: '15m', range: '5d', lookback: 16, steps: 4, newsWeight: 0.15, span: '4 giờ qua' },
  '1d': { interval: '1h', range: '1mo', lookback: 48, steps: 24, newsWeight: 0.25, span: '2 ngày qua' },
  '1w': { interval: '1d', range: '1y', lookback: 20, steps: 5, newsWeight: 0.35, span: '20 phiên qua' },
  '1m': { interval: '1d', range: '1y', lookback: 60, steps: 21, newsWeight: 0.45, span: '60 phiên qua' },
}

const tanh = (x: number) => Math.tanh(x)
const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x))

function ema(values: number[], period: number): number {
  const k = 2 / (period + 1)
  let e = values[0]
  for (let i = 1; i < values.length; i++) e = values[i] * k + e * (1 - k)
  return e
}

function rsi(values: number[]): number {
  let gain = 0
  let loss = 0
  for (let i = 1; i < values.length; i++) {
    const d = values[i] - values[i - 1]
    if (d >= 0) gain += d
    else loss -= d
  }
  if (gain + loss === 0) return 50
  return (100 * gain) / (gain + loss)
}

const fmtPct = (x: number) => `${x >= 0 ? '+' : ''}${x.toFixed(2)}%`

export function forecastFrom(allCloses: number[], horizon: Horizon, newsBias: number, extraBias = 0): Forecast {
  const cfg = HORIZON_CFG[horizon]
  const n = Math.min(cfg.lookback, allCloses.length - 2)
  const win = allCloses.slice(-(n + 1))
  const rets: number[] = []
  for (let i = 1; i < win.length; i++) rets.push(Math.log(win[i] / win[i - 1]))
  const mean = rets.reduce((a, b) => a + b, 0) / rets.length
  const variance = rets.reduce((a, b) => a + (b - mean) ** 2, 0) / rets.length
  const sigma = Math.sqrt(variance) || 1e-6
  const total = Math.log(win[win.length - 1] / win[0])
  const trendZ = total / (sigma * Math.sqrt(rets.length))
  const tech = tanh(trendZ / 2)

  const fast = ema(win, Math.max(3, Math.round(n / 4)))
  const slow = ema(win, n)
  const emaSig = tanh((fast / slow - 1) / (sigma * Math.sqrt(n)))

  const r = rsi(win)
  const revert = r > 70 ? -(r - 70) / 30 : r < 30 ? (30 - r) / 30 : 0

  const score = clamp(0.45 * tech + 0.25 * emaSig + 0.2 * revert + cfg.newsWeight * newsBias + extraBias, -1, 1)
  const dir: Direction = Math.abs(score) < 0.12 ? 'flat' : score > 0 ? 'up' : 'down'
  const confidence = Math.round(50 + Math.min(30, Math.abs(score) * 40))
  const movePct = clamp(score * sigma * Math.sqrt(cfg.steps) * 100, -40, 40)

  const newsTxt = newsBias > 0.15 ? 'tin tức nghiêng tăng' : newsBias < -0.15 ? 'tin tức nghiêng giảm' : 'tin tức trung lập'
  const reason = `${cfg.span}: ${fmtPct(total * 100)}, RSI ${r.toFixed(0)}, ${newsTxt}.`
  return { dir, confidence, movePct: Number(movePct.toFixed(2)), reason }
}

/** Tải dữ liệu đa khung và dự báo cho 5 mốc thời gian */
export async function buildForecasts(
  symbol: string,
  biasFor: (h: Horizon) => number,
): Promise<{ forecasts: ForecastMap; price: number; hourly: number[]; daily: number[] }> {
  const combos = [
    ['5m', '1d'],
    ['15m', '5d'],
    ['1h', '1mo'],
    ['1d', '1y'],
  ] as const
  const fetched = await Promise.all(combos.map(([i, r]) => fetchSeries(symbol, i, r)))
  const byKey: Record<string, Series> = {}
  combos.forEach(([i, r], idx) => {
    byKey[`${i}|${r}`] = fetched[idx]
  })
  const forecasts = {} as ForecastMap
  for (const h of Object.keys(HORIZON_CFG) as Horizon[]) {
    const cfg = HORIZON_CFG[h]
    const s = byKey[`${cfg.interval}|${cfg.range}`]
    forecasts[h] = forecastFrom(s.closes, h, biasFor(h))
  }
  const hourly = byKey['1h|1mo'].closes
  const daily = byKey['1d|1y'].closes
  return { forecasts, price: byKey['5m|1d'].price, hourly, daily }
}

export async function quote(symbol: string): Promise<number | null> {
  try {
    return (await fetchSeries(symbol, '1d', '5d')).price
  } catch {
    return null
  }
}
