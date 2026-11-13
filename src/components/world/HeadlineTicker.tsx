import { Radio } from 'lucide-react'
import { clsx } from 'clsx'
import { headlineKey, useHeadlines } from '@/lib/useHeadlines'
import type { NewsItem } from '@/types/market'

const stamp = (iso: string) =>
  new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }).format(new Date(iso))

function Item({ item, isNew }: { item: NewsItem; isNew: boolean }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex items-center gap-2.5 whitespace-nowrap px-5 py-3 text-sm text-slate-100 hover:text-sky-200"
    >
      <span className={clsx('h-1.5 w-1.5 shrink-0 rounded-full', item.tone === 'good' ? 'bg-emerald-400' : item.tone === 'bad' ? 'bg-rose-400' : 'bg-slate-400')} aria-hidden />
      <time dateTime={item.publishedAt} className="font-medium tabular-nums text-sky-200">
        {stamp(item.publishedAt)}
      </time>
      {isNew ? <span className="rounded bg-sky-200 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-slate-900">Mới</span> : null}
      <span className="group-hover:underline group-hover:underline-offset-4">{item.title}</span>
      <span className="text-xs text-slate-500">{item.source}</span>
    </a>
  )
}

export function HeadlineTicker() {
  const { items, fresh, error } = useHeadlines()
  if (!items.length) {
    return error ? (
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-400">Chưa tải được tin nóng. Sẽ thử lại sau ít phút.</div>
    ) : null
  }
  const chars = items.reduce((a, n) => a + n.title.length + 30, 0)
  const duration = Math.max(40, Math.round(chars * 0.16))
  return (
    <div className="flex items-stretch overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]" role="region" aria-label="Tin nóng thế giới">
      <div className="z-10 flex shrink-0 items-center gap-2 bg-rose-500/90 px-3 text-xs font-bold uppercase tracking-[0.08em] text-white sm:px-4">
        <Radio className="h-4 w-4" aria-hidden />
        Tin nóng
      </div>
      <div className="ticker-viewport relative min-w-0 flex-1 overflow-hidden">
        <div className="ticker-track flex w-max" style={{ animationDuration: `${duration}s` }}>
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 items-center" style={{ minWidth: '100vw' }} aria-hidden={copy === 1}>
              {items.map((n) => (
                <Item key={headlineKey(n)} item={n} isNew={fresh.has(headlineKey(n))} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
