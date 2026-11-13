import { createServer } from 'node:http'
import { route } from './router'

const PORT = Number(process.env.MARKET_API_PORT ?? 3001)

createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost')
  const fresh = url.searchParams.get('fresh') === '1'
  route(url.pathname, fresh)
    .then((body) => {
      if (body === null) {
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end('{"error":"not found"}')
        return
      }
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
      res.end(JSON.stringify(body))
    })
    .catch((err: unknown) => {
      res.writeHead(502, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'upstream error' }))
    })
}).listen(PORT, () => {
  console.log(`market api on :${PORT}`)
})
