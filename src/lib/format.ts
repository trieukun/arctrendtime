const nf0 = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 })
const nf2 = new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const fmtInt = (n: number) => nf0.format(n)
export const fmt2 = (n: number) => nf2.format(n)

export const fmtVnd = (n: number | null | undefined) => (n == null ? '—' : nf0.format(n))

export function fmtPct(n: number, digits = 2): string {
  const s = Math.abs(n).toFixed(digits).replace('.', ',')
  return `${n > 0 ? '+' : n < 0 ? '-' : ''}${s}%`
}

export function fmtSignedVnd(n: number | null | undefined): string {
  if (n == null) return '—'
  if (n === 0) return '0'
  return `${n > 0 ? '+' : '-'}${nf0.format(Math.abs(n))}`
}

export function fmtUsd(n: number, digits = 2): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n)
}

export function timeAgo(iso: string, now = Date.now()): string {
  const diff = Math.max(0, now - new Date(iso).getTime())
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'vừa xong'
  if (m < 60) return `${m} phút trước`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} giờ trước`
  return `${Math.floor(h / 24)} ngày trước`
}

export function fmtDateTime(iso: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso))
}

export function fmtWeekdayTime(iso: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(iso))
}
