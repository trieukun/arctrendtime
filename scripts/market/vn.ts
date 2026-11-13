import type { ForecastMap, FuelRow, GoldRow, Horizon, VnData, WorldData } from '../../src/types/market'
import { HORIZONS } from '../../src/types/market'
import { quote } from './forecast'
import { getText, htmlToText } from './http'

const num = (s: string) => Number(s.replace(/[.,]/g, ''))

function signed(mark: string, v: string): number | null {
  if (mark === '=') return 0
  const n = num(v || '0')
  return mark === '▼' ? -n : n
}

interface GoldQuote {
  buy: number | null
  sell: number | null
  buyChange: number | null
  sellChange: number | null
}

/** 24hmoney: giá đầy đủ đơn vị đồng/lượng kèm thay đổi so với phiên trước */
function parse24h(text: string, label: string): GoldQuote | null {
  const re = new RegExp(
    `${label}\\|[^|]*\\|\\s*([\\d,]+)\\s*\\|\\s*([▼▲=])\\s*([\\d,]*)\\s*\\|\\s*([\\d,]+)\\s*\\|\\s*([▼▲=])\\s*([\\d,]*)`,
  )
  const m = re.exec(text)
  if (!m) return null
  return { buy: num(m[1]), sell: num(m[4]), buyChange: signed(m[2], m[3]), sellChange: signed(m[5], m[6]) }
}

/** giavang.org: đơn vị nghìn đồng/lượng, có dạng "123.456" */
function parseGv(text: string, label: string, sellRequired = true): GoldQuote | null {
  const esc = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`${esc}\\|([\\d.]+)\\|(${sellRequired ? '[\\d.]+' : '[\\d.]+|-'})`)
  const m = re.exec(text)
  if (!m) return null
  return {
    buy: num(m[1]) * 1000,
    sell: m[2] === '-' ? null : num(m[2]) * 1000,
    buyChange: null,
    sellChange: null,
  }
}

function followWorld(world: WorldData | null, premium: number | null, isSjcBar: boolean): ForecastMap {
  const gold = world?.assets.find((a) => a.id === 'gold')
  const out = {} as ForecastMap
  for (const h of HORIZONS) {
    const base = gold?.forecasts[h]
    if (!base) {
      out[h] = { dir: 'flat', confidence: 50, movePct: 0, reason: 'Chưa có dữ liệu vàng thế giới để dự báo.' }
      continue
    }
    let conf = base.confidence - 3
    let move = base.movePct
    let reason = `Bám vàng thế giới. ${base.reason}`
    if (isSjcBar && premium !== null && premium > 10 && (h === '1w' || h === '1m')) {
      reason += ` SJC đang cao hơn giá quy đổi thế giới khoảng ${premium.toFixed(1)}%, dư địa tăng bị hạn chế.`
      if (base.dir === 'up') {
        conf -= 5
        move *= 0.7
      }
    }
    out[h] = { ...base, confidence: Math.max(50, conf), movePct: Number(move.toFixed(2)), reason }
  }
  return out
}

/** Kỳ điều hành giá xăng dầu: 15:00 thứ Năm hằng tuần, giờ Việt Nam (UTC+7) */
export function fuelCycle(now = new Date()): { last: Date; next: Date } {
  const vn = new Date(now.getTime() + 7 * 3.6e6)
  const day = vn.getUTCDay()
  const sinceThu = (day - 4 + 7) % 7
  const lastVn = new Date(Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth(), vn.getUTCDate() - sinceThu, 15, 0, 0))
  if (lastVn.getTime() > vn.getTime()) lastVn.setUTCDate(lastVn.getUTCDate() - 7)
  const nextVn = new Date(lastVn.getTime() + 7 * 864e5)
  return { last: new Date(lastVn.getTime() - 7 * 3.6e6), next: new Date(nextVn.getTime() - 7 * 3.6e6) }
}

const HOURS: Record<Horizon, number> = { '15m': 0.25, '1h': 1, '1d': 24, '1w': 168, '1m': 720 }

function fuelForecasts(world: WorldData | null, now: Date, next: Date, diesel: boolean): ForecastMap {
  const oil = world?.assets.find((a) => a.id === 'oil')
  const hoursToNext = (next.getTime() - now.getTime()) / 3.6e6
  const nextTxt = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(next)
  const out = {} as ForecastMap
  for (const h of HORIZONS) {
    if (HOURS[h] < hoursToNext) {
      out[h] = {
        dir: 'flat',
        confidence: 92,
        movePct: 0,
        reason: `Giá bán lẻ chỉ đổi theo kỳ điều hành (${nextTxt}), chưa tới kỳ trong khung này.`,
      }
      continue
    }
    const o = oil?.forecasts[h === '15m' || h === '1h' ? '1d' : h]
    if (!o) {
      out[h] = { dir: 'flat', confidence: 50, movePct: 0, reason: 'Chưa có dữ liệu giá dầu thế giới.' }
      continue
    }
    const scale = diesel ? 1 : 0.9
    out[h] = {
      dir: o.dir,
      confidence: Math.max(50, o.confidence - 6),
      movePct: Number((o.movePct * scale * 0.6).toFixed(2)),
      reason: `Theo giá dầu thế giới (kỳ điều hành ${nextTxt}). ${o.reason}`,
    }
  }
  return out
}

interface FuelQuote {
  region1: number
  region2: number | null
  change: number | null
}

function parsePetrolimex(text: string, label: string): FuelQuote | null {
  const m = new RegExp(`${label}\\s*\\|\\s*(-?[\\d,]+)\\s*\\|\\s*(-?[\\d,]+)\\s*\\|\\s*([\\d,]+)\\s*\\|\\s*([\\d,]+)`).exec(text)
  if (!m) return null
  return { region1: num(m[3]), region2: num(m[4]), change: Number(m[2].replace(/,/g, '')) }
}

function parseWebgia(text: string, label: string): FuelQuote | null {
  const m = new RegExp(`${label}\\|([\\d.]+)\\|([\\d.]+)`, 'i').exec(text)
  if (!m) return null
  return { region1: num(m[1]), region2: num(m[2]), change: null }
}

export async function loadVn(world: WorldData | null): Promise<VnData> {
  const warnings: string[] = []
  const now = new Date()
  const [h24, phuQuy, miHong, fuelHtml, usd, world2] = await Promise.allSettled([
    getText('https://24hmoney.vn/gia-vang'),
    getText('https://giavang.org/trong-nuoc/phu-quy/'),
    getText('https://giavang.org/trong-nuoc/mi-hong/'),
    getText('https://giaxanghomnay.com/'),
    quote('VND=X'),
    quote('GC=F'),
  ])
  const txt = (r: PromiseSettledResult<string>, name: string): string => {
    if (r.status === 'fulfilled') return htmlToText(r.value)
    warnings.push(`Không tải được nguồn ${name}.`)
    return ''
  }
  const t24 = txt(h24, '24hmoney')
  const tPq = txt(phuQuy, 'giavang.org (Phú Quý)')
  const tMh = txt(miHong, 'giavang.org (Mi Hồng)')
  const tFuel = txt(fuelHtml, 'giá xăng dầu')
  const usdVnd = usd.status === 'fulfilled' ? usd.value : null
  const worldGold = world2.status === 'fulfilled' ? world2.value : null

  const sjc = parse24h(t24, 'Vàng Miếng SJC')
  const ring = parse24h(t24, 'Vàng Nhẫn SJC')
  const pq98 = parseGv(tPq, 'Vàng trang sức 98')
  const mh95 = parseGv(tMh, 'Vàng 95 (95,0%)', false)

  let premium: number | null = null
  if (sjc?.sell && usdVnd && worldGold) {
    const world = worldGold * usdVnd * (37.5 / 31.1035)
    premium = Number((((sjc.sell - world) / world) * 100).toFixed(1))
  }

  const mk = (id: string, name: string, note: string, q: GoldQuote | null, source: string, bar: boolean): GoldRow | null => {
    if (!q) {
      warnings.push(`Chưa lấy được giá ${name}.`)
      return null
    }
    return { id, name, note, ...q, source, forecasts: followWorld(world, premium, bar) }
  }
  const gold = [
    mk('sjc', 'Vàng miếng SJC', 'Đồng/lượng, nguồn 24hmoney', sjc, '24hmoney.vn', true),
    mk('9999', 'Vàng 9999 (nhẫn SJC 99,99)', 'Đồng/lượng, nguồn 24hmoney', ring, '24hmoney.vn', false),
    mk('98', 'Vàng 98 (trang sức Phú Quý)', 'Đồng/lượng, nguồn giavang.org', pq98, 'giavang.org (Phú Quý)', false),
    mk('96', 'Vàng 95 (Mi Hồng, chưa có niêm yết 96)', 'Chỉ có giá mua vào, nguồn giavang.org', mh95, 'giavang.org (Mi Hồng)', false),
  ].filter((r): r is GoldRow => r !== null)

  const { last, next } = fuelCycle(now)
  const fuelDefs = [
    { id: 'e10', name: 'Xăng E10 RON 95-V', pe: 'E10 RON 95 Mức 5', wg: 'Xăng E10 RON 95 mức 5', diesel: false },
    { id: 'do005', name: 'Dầu diesel DO 0,05S-II', pe: 'DO 0,05S Mức 2', wg: 'Dầu DO 0,05S mức 2', diesel: true },
    { id: 'do0001', name: 'Dầu diesel DO 0,001S-V', pe: 'DO 0,001S Mức 5', wg: 'Dầu DO 0,001S mức 5', diesel: true },
  ]
  const fuel: FuelRow[] = []
  for (const d of fuelDefs) {
    const q = parsePetrolimex(tFuel, d.pe)
    if (!q) {
      warnings.push(`Chưa lấy được giá ${d.name}.`)
      continue
    }
    fuel.push({
      id: d.id,
      name: d.name,
      region1: q.region1,
      region2: q.region2,
      changeLastAdjust: q.change,
      forecasts: fuelForecasts(world, now, next, d.diesel),
    })
  }
  // Nguồn dự phòng khi giaxanghomnay.com không phân tích được
  if (!fuel.length) {
    try {
      const tWg = htmlToText(await getText('https://webgia.com/gia-xang-dau/'))
      for (const d of fuelDefs) {
        const q = parseWebgia(tWg, d.wg)
        if (q) {
          fuel.push({
            id: d.id,
            name: d.name,
            region1: q.region1,
            region2: q.region2,
            changeLastAdjust: null,
            forecasts: fuelForecasts(world, now, next, d.diesel),
          })
        }
      }
    } catch {
      warnings.push('Không tải được giá xăng dầu từ nguồn dự phòng.')
    }
  }

  return {
    updatedAt: now.toISOString(),
    gold,
    fuel,
    fuelSource: 'Petrolimex (bán lẻ, vùng 1 và vùng 2)',
    lastFuelAdjust: last.toISOString(),
    nextFuelAdjust: next.toISOString(),
    usdVnd,
    sjcPremiumPct: premium,
    worldGoldUsd: worldGold,
    warnings,
  }
}
