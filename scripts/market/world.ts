import type { FedInfo, Horizon, ImpactKey, NewsItem, WorldAsset, WorldData } from '../../src/types/market'
import { buildForecasts, quote } from './forecast'
import { fetchNews, newsBias } from './news'

const FED_STATIC = {
  asOf: '28/10/2026',
  targetRange: '3,75% - 4,00%',
  lastDecision: 'Giữ nguyên lãi suất ngày 28/10/2026 (lần tăng gần nhất: 15/9/2026, +0,25 điểm %)',
  vote: 'Biểu quyết 10-2: Cook và Hammack muốn tăng thêm 0,25 điểm %',
  chair: 'Chủ tịch Kevin Warsh',
  nextMeeting: '8-9/12/2026',
  marketPricing: 'CME FedWatch (28/10): khoảng 86-88% khả năng tăng 0,25 điểm % tại cuộc họp tháng 12',
  inflation: 'CPI tháng 9/2026: 3,7% so với cùng kỳ (tháng 8: 3,4%)',
  outlook: [
    'Đa số ngân hàng lớn (JPMorgan, Goldman Sachs, Barclays, Citi...) dự báo tăng 0,25 điểm % vào tháng 12, đưa mặt bằng lên 4,00% - 4,25%.',
    'PNC dự báo thêm một lần tăng vào tháng 3/2027 (4,25% - 4,50%) rồi giữ nguyên.',
    'Thị trường kỳ hạn định giá lãi suất cuối 2027 quanh 4,50% - 4,75%.',
    'Năm 2027 sẽ có một cuộc họp chỉ bàn chiến lược, không quyết định lãi suất.',
  ],
  sources: [
    { label: 'Federal Reserve: FOMC statement 28/10/2026', url: 'https://www.federalreserve.gov/newsevents/pressreleases/monetary20261028a.htm' },
    { label: 'CNBC: Fed interest rate decision October 2026', url: 'https://www.cnbc.com/2026/10/28/fed-interest-rate-decision-october-2026.html' },
    { label: 'PNC Economics: FOMC 28/10/2026', url: 'https://www.pnc.com/content/dam/pnc-com/pdf/aboutpnc/EconomicReports/EconomicUpdates/2026/PNC_Economics_FOMC_28_October_2026.pdf' },
    { label: 'J.P. Morgan Global Research: What’s the Fed’s next move?', url: 'https://www.jpmorgan.com/insights/global-research/economy/fed-rate-cuts' },
  ],
}

type Biases = Record<ImpactKey, number>

function pctChange(closes: number[]): number {
  if (closes.length < 2) return 0
  const prev = closes[closes.length - 2]
  const last = closes[closes.length - 1]
  return (last / prev - 1) * 100
}

async function buildAsset(
  id: WorldAsset['id'],
  name: string,
  symbol: string,
  unit: string,
  biasKeys: ImpactKey[],
  biases: Biases,
): Promise<{ asset: WorldAsset; daily: number[] }> {
  const biasFor = (h: Horizon) => {
    void h
    return biasKeys.reduce((a, k) => a + biases[k], 0) / biasKeys.length
  }
  const r = await buildForecasts(symbol, biasFor)
  return {
    daily: r.daily,
    asset: {
      id,
      name,
      symbol,
      price: r.price,
      unit,
      changePct24h: Number(pctChange(r.daily).toFixed(2)),
      series: r.hourly.slice(-72),
      forecasts: r.forecasts,
    },
  }
}

export async function loadWorld(): Promise<WorldData> {
  const warnings: string[] = []
  let news: NewsItem[] = []
  try {
    const n = await fetchNews()
    news = n.items
    if (n.failed) warnings.push(`${n.failed} nguồn tin không tải được, danh sách tin có thể chưa đầy đủ.`)
  } catch {
    warnings.push('Không tải được tin tức.')
  }
  const biases: Biases = {
    btc: newsBias(news, 'btc'),
    crypto: newsBias(news, 'crypto'),
    gold: newsBias(news, 'gold'),
    oil: newsBias(news, 'oil'),
    rates: newsBias(news, 'rates'),
  }

  const [btc, gold, wti, brent, tnx, irx, dxy] = await Promise.allSettled([
    buildAsset('btc', 'Bitcoin', 'BTC-USD', 'USD', ['btc', 'crypto'], biases),
    buildAsset('gold', 'Vàng thế giới', 'GC=F', 'USD/ounce', ['gold'], biases),
    buildAsset('oil', 'Dầu thô WTI', 'CL=F', 'USD/thùng', ['oil'], biases),
    quote('BZ=F'),
    quote('^TNX'),
    quote('^IRX'),
    quote('DX-Y.NYB'),
  ])

  const assets: WorldAsset[] = []
  for (const [label, res] of [
    ['Bitcoin', btc],
    ['Vàng', gold],
    ['Dầu WTI', wti],
  ] as const) {
    if (res.status === 'fulfilled') assets.push(res.value.asset)
    else warnings.push(`Không tải được giá ${label}.`)
  }
  const oil = assets.find((a) => a.id === 'oil')
  if (oil && brent.status === 'fulfilled' && brent.value) {
    oil.extra = [{ label: 'Brent', value: `${brent.value.toFixed(2)} USD/thùng` }]
  }
  const val = (r: PromiseSettledResult<number | null>) => (r.status === 'fulfilled' ? r.value : null)

  const fed: FedInfo = { ...FED_STATIC, us10y: val(tnx), us13w: val(irx), dxy: val(dxy) }
  return {
    updatedAt: new Date().toISOString(),
    assets,
    news: {
      good: news.filter((n) => n.tone === 'good').slice(0, 14),
      bad: news.filter((n) => n.tone === 'bad').slice(0, 14),
      other: news.filter((n) => n.tone === 'neutral').slice(0, 10),
    },
    fed,
    warnings,
  }
}

export { buildAsset }
