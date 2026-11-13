import { useCallback, useEffect, useState } from 'react'
import type { BanksData, VnData, WorldData } from '@/types/market'

interface Snapshot {
  world: WorldData | null
  vn: VnData | null
  banks: BanksData | null
}

const STORAGE_KEY = 'market-snapshot-v2'

function readSnapshot(): Snapshot | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as Snapshot
    // Bỏ bản lưu không đúng cấu trúc để tránh làm trang bị lỗi
    if (s.world && (!Array.isArray(s.world.assets) || !s.world.news || !s.world.fed)) s.world = null
    if (s.vn && (!Array.isArray(s.vn.gold) || !Array.isArray(s.vn.fuel))) s.vn = null
    if (s.banks && !Array.isArray(s.banks.banks)) s.banks = null
    return s.world || s.vn || s.banks ? s : null
  } catch {
    return null
  }
}

function writeSnapshot(s: Snapshot) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
  } catch {
    // bộ nhớ đầy hoặc bị chặn: bỏ qua, dữ liệu vẫn hiển thị trong phiên
  }
}

async function load<T>(path: string, fresh: boolean): Promise<T> {
  const res = await fetch(`/api/${path}${fresh ? '?fresh=1' : ''}`)
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`)
  return (await res.json()) as T
}

export interface MarketState extends Snapshot {
  loading: boolean
  errors: string[]
  refresh: () => Promise<void>
}

/**
 * Dữ liệu chỉ được tải khi chưa có bản lưu hoặc khi người dùng bấm Làm mới.
 * Mở lại trang không tự cập nhật: giữ nguyên bản đã lưu gần nhất.
 */
type Results = [PromiseSettledResult<WorldData>, PromiseSettledResult<VnData>, PromiseSettledResult<BanksData>]

function fetchAll(): Promise<Results> {
  return Promise.allSettled([load<WorldData>('world', true), load<VnData>('vn', true), load<BanksData>('banks', true)])
}

export function useMarket(): MarketState {
  const [snap, setSnap] = useState<Snapshot>(() => readSnapshot() ?? { world: null, vn: null, banks: null })
  const [needsInitial] = useState(() => !readSnapshot())
  const [loading, setLoading] = useState(needsInitial)
  const [errors, setErrors] = useState<string[]>([])

  const apply = useCallback(([world, vn, banks]: Results) => {
    const errs: string[] = []
    const pick = <T,>(r: PromiseSettledResult<T>, old: T | null, name: string): T | null => {
      if (r.status === 'fulfilled') return r.value
      errs.push(`Không cập nhật được mục ${name}. Đang giữ dữ liệu cũ.`)
      return old
    }
    setSnap((prev) => ({
      world: pick(world, prev.world, 'Thế giới'),
      vn: pick(vn, prev.vn, 'Trong nước'),
      banks: pick(banks, prev.banks, 'Lãi suất ngân hàng'),
    }))
    setErrors(errs)
    setLoading(false)
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    apply(await fetchAll())
  }, [apply])

  useEffect(() => {
    if (snap.world || snap.vn || snap.banks) writeSnapshot(snap)
  }, [snap])

  useEffect(() => {
    if (needsInitial) void fetchAll().then(apply)
  }, [needsInitial, apply])

  return { ...snap, loading, errors, refresh }
}
