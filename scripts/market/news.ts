import type { ImpactKey, NewsItem } from '../../src/types/market'
import { getText } from './http'

interface Rule {
  war?: boolean
  topic: string
  re: RegExp
  impacts: Partial<Record<ImpactKey, number>>
}

const PEACE = /(ngừng bắn|đình chiến|hòa đàm|hạ nhiệt|hòa bình|gặp trực tiếp|thượng đỉnh|tìm lối thoát|vòng đàm phán|đàm phán hòa|nối lại đàm phán)/i

// Thứ tự quan trọng: mỗi tiêu đề có thể khớp nhiều luật, các tác động được cộng dồn (giới hạn -2..2).
const RULES: Rule[] = [
  { topic: 'FED', re: /(tăng lãi suất|nâng lãi suất|tăng (thêm )?25 điểm cơ bản|hawkish|diều hâu|thắt chặt (tiền tệ|chính sách)|rate hike|raise rates)/i, impacts: { btc: -2, crypto: -2, gold: -1, rates: 2 } },
  { topic: 'FED', re: /(giảm lãi suất|hạ lãi suất|cắt giảm lãi suất|nới lỏng (tiền tệ|chính sách)|dovish|rate cut)/i, impacts: { btc: 2, crypto: 2, gold: 2, rates: -2 } },
  { topic: 'FED', re: /(giữ nguyên lãi suất|giữ lãi suất)/i, impacts: { rates: 0, btc: 0 } },
  { topic: 'Lạm phát', re: /(lạm phát|cpi|pce).{0,30}(tăng|nóng|cao hơn|vượt)/i, impacts: { btc: -1, crypto: -1, gold: 1, rates: 1 } },
  { topic: 'Lạm phát', re: /(lạm phát|cpi|pce).{0,30}(giảm|hạ nhiệt|thấp hơn|dịu)/i, impacts: { btc: 1, crypto: 1, gold: 1, rates: -1 } },
  { topic: 'Việc làm Mỹ', re: /(bảng lương|việc làm|thất nghiệp).{0,30}(mạnh|tăng mạnh|vượt dự báo|giảm mạnh)/i, impacts: { rates: 1, gold: -1, btc: -1 } },
  { topic: 'Việc làm Mỹ', re: /(bảng lương|việc làm).{0,30}(yếu|chậm lại|dưới dự báo|suy yếu)/i, impacts: { rates: -1, gold: 1, btc: 1 } },
  { topic: 'Địa chính trị', war: true, re: /(chiến sự|chiến tranh|tấn công|không kích|tên lửa|xung đột|leo thang|căng thẳng|phong tỏa|eo biển hormuz|đe dọa|tập kích|nổ|biến động địa chính trị)/i, impacts: { gold: 2, oil: 2, btc: -1, crypto: -1 } },
  { topic: 'Địa chính trị', re: /(ngừng bắn|đình chiến|hòa đàm|hạ nhiệt|thỏa thuận hòa bình|đàm phán hòa bình|nối lại đàm phán|đạt thỏa thuận)/i, impacts: { gold: -1, oil: -2, btc: 1, crypto: 1 } },
  { topic: 'Địa chính trị', re: /(gặp trực tiếp|thượng đỉnh|tìm lối thoát|hòa bình|hoan nghênh.{0,30}đàm phán|vòng đàm phán|thỏa thuận hòa)/i, impacts: { gold: -1, oil: -2, btc: 1, crypto: 1 } },
  { topic: 'Trừng phạt', re: /(trừng phạt|cấm vận|hạn chế xuất khẩu dầu)/i, impacts: { oil: 2, gold: 1, btc: -1 } },
  { topic: 'Thuế quan', re: /(thuế quan|thuế nhập khẩu|chiến tranh thương mại|áp thuế)/i, impacts: { btc: -1, crypto: -1, gold: 1, oil: -1 } },
  { topic: 'Chính phủ Mỹ', re: /(đóng cửa chính phủ|shutdown|nợ công|trần nợ|thâm hụt ngân sách|hạ bậc tín nhiệm)/i, impacts: { gold: 2, btc: -1, rates: 1 } },
  { topic: 'USD & lợi suất', re: /(usd (mạnh|tăng)|đồng usd (mạnh|tăng)|chỉ số usd (tăng|leo)|lợi suất trái phiếu.{0,20}(tăng|leo|vọt))/i, impacts: { gold: -2, btc: -1, rates: 1 } },
  { topic: 'USD & lợi suất', re: /(usd (yếu|giảm)|đồng usd (yếu|giảm)|chỉ số usd (giảm|lùi)|lợi suất trái phiếu.{0,20}(giảm|hạ|lùi))/i, impacts: { gold: 2, btc: 1, rates: -1 } },
  { topic: 'Dầu mỏ', re: /(opec\+?.{0,30}(cắt giảm|giảm sản lượng)|nguồn cung (thắt chặt|gián đoạn)|tồn kho (dầu )?giảm)/i, impacts: { oil: 2 } },
  { topic: 'Dầu mỏ', re: /(tăng sản lượng|dư cung|tồn kho (dầu )?tăng|nhu cầu (dầu )?(yếu|suy giảm))/i, impacts: { oil: -2 } },
  { topic: 'Dầu mỏ', re: /(giá dầu).{0,25}(tăng|vọt|leo|bật tăng)/i, impacts: { oil: 1 } },
  { topic: 'Dầu mỏ', re: /(giá dầu).{0,25}(giảm|lao dốc|sụt|rơi|mất)/i, impacts: { oil: -1 } },
  { topic: 'Vàng', re: /(giá vàng|vàng thế giới|vàng).{0,25}(tăng|vọt|leo|bật tăng|lập đỉnh|kỷ lục)/i, impacts: { gold: 1 } },
  { topic: 'Vàng', re: /(giá vàng|vàng thế giới|vàng).{0,25}(giảm|lao dốc|rơi|mất|trượt|sụt|lùi)/i, impacts: { gold: -1 } },
  { topic: 'Bitcoin', re: /(bitcoin|btc).{0,30}(tăng|bật tăng|vọt|lên đỉnh|hồi phục|phục hồi|vượt)/i, impacts: { btc: 1, crypto: 1 } },
  { topic: 'Bitcoin', re: /(bitcoin|btc).{0,30}(giảm|lao dốc|rơi|mất mốc|thủng|bốc hơi|sụt|đỏ lửa)/i, impacts: { btc: -1, crypto: -1 } },
  { topic: 'Crypto', re: /(etf (bitcoin|ethereum|crypto)|dòng vốn.{0,15}(vào|đổ)|tổ chức.{0,15}(mua|gom)|chấp thuận|phê duyệt)/i, impacts: { btc: 2, crypto: 1 } },
  { topic: 'Crypto', re: /(bán tháo|rút ròng|thanh lý|bị hack|vụ hack|đánh cắp|siết chặt|lệnh cấm|đàn áp|sụp đổ|phá sản)/i, impacts: { btc: -2, crypto: -2 } },
  { topic: 'Chứng khoán', re: /(phố wall|chứng khoán mỹ|s&p 500|nasdaq|dow jones).{0,25}(tăng|lập đỉnh|bật tăng)/i, impacts: { btc: 1, crypto: 1, gold: -1 } },
  { topic: 'Chứng khoán', re: /(phố wall|chứng khoán mỹ|s&p 500|nasdaq|dow jones).{0,25}(giảm|lao dốc|bán tháo|sụt)/i, impacts: { btc: -1, crypto: -1, gold: 1 } },
]

export const NEWS_QUERIES = [
  'Fed lãi suất FOMC',
  'bitcoin giá',
  'giá vàng thế giới',
  'giá dầu thô OPEC',
  'Nga Ukraine',
  'Iran Mỹ',
  'chính phủ Mỹ Trump thuế quan',
  'phương tây trừng phạt',
  'thị trường tiền điện tử',
]

function decode(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .trim()
}

function tag(block: string, name: string): string {
  const m = new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`).exec(block)
  return m ? decode(m[1]) : ''
}

function classify(title: string): { topic: string; impacts: Partial<Record<ImpactKey, number>> } | null {
  const impacts: Partial<Record<ImpactKey, number>> = {}
  const topics: string[] = []
  const peace = PEACE.test(title)
  for (const rule of RULES) {
    if (rule.war && peace) continue
    if (!rule.re.test(title)) continue
    topics.push(rule.topic)
    for (const [k, v] of Object.entries(rule.impacts) as [ImpactKey, number][]) {
      impacts[k] = Math.max(-2, Math.min(2, (impacts[k] ?? 0) + v))
    }
  }
  const nonZero = Object.values(impacts).some((v) => v !== 0)
  if (!topics.length || !nonZero) return null
  return { topic: topics[0], impacts }
}

function toneOf(i: Partial<Record<ImpactKey, number>>): 'good' | 'bad' | 'neutral' {
  const risk = (i.btc ?? 0) + 0.5 * (i.crypto ?? 0) - 0.5 * (i.rates ?? 0)
  if (risk !== 0) return risk > 0 ? 'good' : 'bad'
  return 'neutral'
}

export async function fetchNews(): Promise<{ items: NewsItem[]; failed: number }> {
  let failed = 0
  const feeds = await Promise.all(
    NEWS_QUERIES.map(async (q) => {
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(`${q} when:2d`)}&hl=vi&gl=VN&ceid=VN:vi`
      try {
        return await getText(url, 12000)
      } catch {
        failed++
        return ''
      }
    }),
  )
  const seen = new Set<string>()
  const items: NewsItem[] = []
  for (const xml of feeds) {
    const blocks = xml.match(/<item>[\s\S]*?<\/item>/g) ?? []
    for (const b of blocks.slice(0, 25)) {
      const rawTitle = tag(b, 'title')
      const source = tag(b, 'source')
      const title = source ? rawTitle.replace(new RegExp(`\\s*-\\s*${source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`), '') : rawTitle
      const key = title.toLowerCase().slice(0, 60)
      if (!title || seen.has(key)) continue
      seen.add(key)
      const c = classify(title)
      if (!c) continue
      const tone = toneOf(c.impacts)
      const date = new Date(tag(b, 'pubDate'))
      if (Number.isNaN(date.getTime())) continue
      items.push({
        title,
        source: source || 'Google News',
        url: tag(b, 'link'),
        publishedAt: date.toISOString(),
        topic: c.topic,
        tone,
        impacts: c.impacts,
      })
    }
  }
  items.sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))
  return { items, failed }
}

/** Độ lệch tin tức -1..1 cho một loại tài sản, trọng số giảm dần theo thời gian (bán rã ~12 giờ). */
export function newsBias(items: NewsItem[], key: ImpactKey): number {
  const now = Date.now()
  let sum = 0
  for (const it of items) {
    const v = it.impacts[key]
    if (!v) continue
    const ageH = Math.max(0, (now - +new Date(it.publishedAt)) / 3.6e6)
    sum += v * Math.exp(-ageH / 12)
  }
  return Math.tanh(sum / 5)
}

/** Tin nóng: chỉ lấy tin trong 24 giờ, xếp theo mức tác động và độ mới, trả về theo thứ tự thời gian mới nhất trước. */
export function topHeadlines(items: NewsItem[], limit = 20): NewsItem[] {
  const now = Date.now()
  const scored = items
    .map((it) => {
      const ageH = (now - +new Date(it.publishedAt)) / 3.6e6
      const impact = Object.values(it.impacts).reduce((a, v) => a + Math.abs(v ?? 0), 0)
      return { it, ageH, score: impact * Math.exp(-Math.max(0, ageH) / 8) }
    })
    .filter((x) => x.ageH <= 24 && x.ageH > -0.5 && x.score >= 0.4)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
  return scored.map((x) => x.it).sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))
}
