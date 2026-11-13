import type { ReactNode } from 'react'
import { clsx } from 'clsx'

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={clsx('rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.025] p-5 shadow-[0_1px_0_rgba(255,255,255,0.06)_inset] sm:p-7', className)}>
      {children}
    </section>
  )
}

export function SectionTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <h2 className="font-display text-xl font-semibold tracking-tight text-white sm:text-2xl">{title}</h2>
      {hint ? <p className="text-sm text-slate-400">{hint}</p> : null}
    </div>
  )
}

export function Disclaimer({ children }: { children: ReactNode }) {
  return <p className="text-pretty text-[13px] leading-relaxed text-slate-400">{children}</p>
}
