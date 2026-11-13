import type { BankInfo, BanksData, DepositRow } from '../../src/types/market'
import { getText, htmlToText } from './http'

const TERMS = ['1 tháng', '3 tháng', '6 tháng', '9 tháng', '12 tháng', '18 tháng', '24 tháng'] as const
type Term = (typeof TERMS)[number]
type Table = Partial<Record<Term, string>>

const fmt = (n: number) => `${n.toFixed(2).replace('.', ',')}%`

// Dữ liệu tham chiếu đã đối chiếu từ biểu lãi suất công bố và báo chí tài chính (tháng 11/2026).
// Gửi tại quầy được ghi đè bằng dữ liệu tải trực tiếp khi nguồn trả về được.
const CURATED: Record<string, { counter: Table; online: Table; counterSrc: string; onlineSrc: string; asOf: string }> = {
  agribank: {
    counter: { '1 tháng': '2,60%', '3 tháng': '2,90%', '6 tháng': '3,50%', '9 tháng': '3,50%', '12 tháng': '5,40%', '18 tháng': '5,40%', '24 tháng': '5,50%' },
    online: { '1 tháng': '4,75%', '3 tháng': '4,75%', '6 tháng': '6,60%', '9 tháng': '6,60%', '12 tháng': '6,80%', '18 tháng': '6,80%', '24 tháng': '6,80%' },
    counterSrc: 'simplize.vn',
    onlineSrc: 'CafeF 8/11/2026, VietnamPlus 10/11/2026',
    asOf: '10/11/2026',
  },
  vietcombank: {
    counter: { '1 tháng': '2,10%', '3 tháng': '2,40%', '6 tháng': '3,00%', '9 tháng': '3,00%', '12 tháng': '5,40%', '18 tháng': '—', '24 tháng': '5,50%' },
    online: { '6 tháng': '6,60%', '9 tháng': '6,60%', '12 tháng': '6,80%', '18 tháng': '6,80%' },
    counterSrc: 'simplize.vn',
    onlineSrc: 'CafeF 8/11/2026',
    asOf: '8/11/2026',
  },
  sacombank: {
    counter: { '6 tháng': '5,70%', '9 tháng': '5,70%', '12 tháng': '5,40%', '18 tháng': '5,50%', '24 tháng': '6,20%' },
    online: { '6 tháng': '6,30 - 6,70%', '9 tháng': '6,30 - 6,70%', '12 tháng': '6,50 - 7,00%', '18 tháng': '6,50 - 7,00%', '24 tháng': 'đến 7,30%' },
    counterSrc: 'Sacombank 20/10/2026 (dưới 500 triệu), taichinh.com biểu hiệu lực 6/11/2026',
    onlineSrc: 'Sacombank 20/10/2026, CafeF 13/11/2026 (tùy số tiền gửi, từ 500 triệu cao nhất)',
    asOf: '13/11/2026',
  },
}

const LOANS = {
  agribank: { unsecured: '7,0 - 17,0%/năm', mortgage: '6,5 - 10,5%/năm', overdraft: 'Có TSBĐ khoảng 5 - 10%; không TSBĐ 12,9 - 18%/năm (mặt bằng thị trường, theo thỏa thuận)' },
  vietcombank: { unsecured: '10,8 - 14,4%/năm', mortgage: '5,5 - 9,5%/năm', overdraft: 'Có TSBĐ khoảng 5 - 10%; không TSBĐ 12,9 - 18%/năm (mặt bằng thị trường, theo thỏa thuận)' },
  sacombank: { unsecured: '9,6 - 18,0%/năm', mortgage: '7,49 - 12,0%/năm', overdraft: 'Có TSBĐ khoảng 5 - 10%; không TSBĐ 12,9 - 18%/năm (mặt bằng thị trường, theo thỏa thuận)' },
}

const NAMES: Record<string, string> = { agribank: 'Agribank', vietcombank: 'Vietcombank', sacombank: 'Sacombank' }

/** simplize.vn: bảng lãi suất gửi tại quầy theo kỳ hạn, cột: KKH,1,3,6,9,12,13,18,24,36 */
function parseSimplize(text: string, bank: string): Table | null {
  const m = new RegExp(`\\|${bank}\\|((?:[\\d.]+%|-)\\|){10}`).exec(text)
  if (!m) return null
  const cells = m[0].split('|').slice(2, 12)
  const at = (i: number) => {
    const c = cells[i]
    if (!c || c === '-') return '—'
    return fmt(Number(c.replace('%', '')))
  }
  return { '1 tháng': at(1), '3 tháng': at(2), '6 tháng': at(3), '9 tháng': at(4), '12 tháng': at(5), '18 tháng': at(7), '24 tháng': at(8) }
}

function buildRows(counter: Table, online: Table): DepositRow[] {
  return TERMS.map((t) => ({ term: t, counter: counter[t] ?? '—', online: online[t] ?? '—' }))
}

export async function loadBanks(): Promise<BanksData> {
  const warnings: string[] = []
  let simplize = ''
  try {
    simplize = htmlToText(await getText('https://simplize.vn/lai-suat-ngan-hang'))
  } catch {
    warnings.push('Không tải được bảng lãi suất trực tiếp, đang hiển thị dữ liệu tham chiếu gần nhất.')
  }
  const banks: BankInfo[] = (['agribank', 'vietcombank', 'sacombank'] as const).map((id) => {
    const c = CURATED[id]
    const liveKey = id === 'agribank' ? 'Agribank' : id === 'vietcombank' ? 'Vietcombank' : null
    const live = liveKey && simplize ? parseSimplize(simplize, liveKey) : null
    const counter = live ?? c.counter
    const notes = [
      'Lãi suất gửi online thường cao hơn gửi tại quầy; mức cụ thể tùy số tiền gửi và chương trình.',
      'Lãi suất cho vay là khung tham khảo: ngân hàng áp mức riêng theo hồ sơ, tài sản bảo đảm và thời điểm.',
    ]
    if (!live && liveKey) notes.push('Cột tại quầy đang dùng số liệu tham chiếu vì chưa tải được bảng trực tiếp.')
    return {
      id,
      name: NAMES[id],
      deposits: buildRows(counter, c.online),
      loans: LOANS[id],
      depositSource: `Tại quầy: ${live ? 'simplize.vn (vừa tải)' : c.counterSrc}. Online: ${c.onlineSrc}.`,
      depositAsOf: live ? new Date().toLocaleDateString('vi-VN') : c.asOf,
      loanSource: 'Techcombank blog 12/11/2026, VPBank 11/2026, Techcombank 5/11/2026 (thấu chi)',
      live: Boolean(live),
      notes,
    }
  })
  return { updatedAt: new Date().toISOString(), banks, warnings }
}
