import { route } from '../../scripts/market/router'

// Hàm Netlify: phục vụ /api/world, /api/vn, /api/banks, /api/headlines, /api/health
export default async (req: Request): Promise<Response> => {
  const url = new URL(req.url)
  const path = url.pathname.replace(/^\/api/, '') || '/'
  const fresh = url.searchParams.get('fresh') === '1'
  const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
  try {
    const body = await route(path, fresh)
    if (body === null) return new Response('{"error":"not found"}', { status: 404, headers })
    return new Response(JSON.stringify(body), { status: 200, headers })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'upstream error'
    return new Response(JSON.stringify({ error: message }), { status: 502, headers })
  }
}

export const config = { path: '/api/*' }
