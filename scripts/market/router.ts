import type { BanksData, HeadlinesData, VnData, WorldData } from '../../src/types/market'
import { loadBanks } from './banks'
import { TtlCache } from './http'
import { fetchNews, topHeadlines } from './news'
import { loadVn } from './vn'
import { loadWorld } from './world'

const worldCache = new TtlCache<WorldData>(60_000)
const vnCache = new TtlCache<VnData>(60_000)
const headlineCache = new TtlCache<HeadlinesData>(45_000)
const bankCache = new TtlCache<BanksData>(10 * 60_000)

/** Điều phối chung cho máy chủ cục bộ và hàm Netlify. Trả về null nếu đường dẫn không tồn tại. */
export async function route(path: string, fresh: boolean): Promise<unknown> {
  if (path === '/world') return worldCache.get(loadWorld, fresh)
  if (path === '/vn') {
    const world = await worldCache.get(loadWorld, false).catch(() => null)
    return vnCache.get(() => loadVn(world), fresh)
  }
  if (path === '/headlines') {
    return headlineCache.get(async () => {
      const { items } = await fetchNews()
      return { updatedAt: new Date().toISOString(), items: topHeadlines(items) }
    }, fresh)
  }
  if (path === '/banks') return bankCache.get(loadBanks, fresh)
  if (path === '/health') return { ok: true }
  return null
}
