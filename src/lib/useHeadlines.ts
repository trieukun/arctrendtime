import { useEffect, useRef, useState } from 'react'
import type { HeadlinesData, NewsItem } from '@/types/market'

const POLL_MS = 60_000
const MAX_ITEMS = 24
const keyOf = (n: NewsItem) => `${n.url}|${n.title}`

export interface HeadlineState {
  items: NewsItem[]
  /** Khóa của các tin vừa xuất hiện sau lần tải đầu, dùng để gắn nhãn "Mới" */
  fresh: Set<string>
  checkedAt: string | null
  error: boolean
}

/**
 * Tải tin nóng rồi hỏi lại mỗi phút. Chỉ khi có tin mới thì danh sách mới thay đổi;
 * không có tin mới thì giữ nguyên, băng chạy không bị khởi động lại.
 */
export function useHeadlines(): HeadlineState {
  const [state, setState] = useState<HeadlineState>({ items: [], fresh: new Set(), checkedAt: null, error: false })
  const seen = useRef<Set<string> | null>(null)

  useEffect(() => {
    const ctl = new AbortController()
    const tick = async () => {
      try {
        const res = await fetch('/api/headlines', { signal: ctl.signal })
        if (!res.ok) throw new Error(String(res.status))
        const data = (await res.json()) as HeadlinesData
        if (ctl.signal.aborted) return
        const known = seen.current
        const incoming = data.items.filter((n) => !known || !known.has(keyOf(n)))
        if (!known) {
          seen.current = new Set(data.items.map(keyOf))
          setState({ items: data.items.slice(0, MAX_ITEMS), fresh: new Set(), checkedAt: data.updatedAt, error: false })
          return
        }
        if (!incoming.length) {
          setState((s) => (s.error ? { ...s, error: false } : s))
          return
        }
        incoming.forEach((n) => known.add(keyOf(n)))
        setState((s) => {
          const merged = [...incoming, ...s.items]
            .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))
            .slice(0, MAX_ITEMS)
          const fresh = new Set(s.fresh)
          incoming.forEach((n) => fresh.add(keyOf(n)))
          return { items: merged, fresh, checkedAt: data.updatedAt, error: false }
        })
      } catch {
        if (!ctl.signal.aborted) setState((s) => (s.error ? s : { ...s, error: true }))
      }
    }
    void tick()
    const id = window.setInterval(() => void tick(), POLL_MS)
    return () => {
      ctl.abort()
      window.clearInterval(id)
    }
  }, [])

  return state
}

export { keyOf as headlineKey }
