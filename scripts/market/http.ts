const UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

export async function getText(url: string, timeoutMs = 12000): Promise<string> {
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: ctl.signal,
      headers: { 'User-Agent': UA, 'Accept-Language': 'vi,en;q=0.8' },
      redirect: 'follow',
    })
    if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`)
    return await res.text()
  } finally {
    clearTimeout(timer)
  }
}

export async function getJson<T>(url: string, timeoutMs = 12000): Promise<T> {
  return JSON.parse(await getText(url, timeoutMs)) as T
}

/** Chuyển HTML thành chuỗi văn bản, các ô cách nhau bởi dấu | */
export function htmlToText(html: string): string {
  const noScript = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, '')
  const piped = noScript.replace(/<[^>]+>/g, '|')
  return piped
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\|[\s|]*\|/g, '|')
    .replace(/\s+/g, ' ')
}

export class TtlCache<T> {
  private value: T | null = null
  private at = 0
  private pending: Promise<T> | null = null
  constructor(private ttlMs: number) {}

  async get(load: () => Promise<T>, fresh: boolean): Promise<T> {
    const age = Date.now() - this.at
    if (!fresh && this.value && age < this.ttlMs) return this.value
    if (this.pending) return this.pending
    this.pending = load()
      .then((v) => {
        this.value = v
        this.at = Date.now()
        return v
      })
      .finally(() => {
        this.pending = null
      })
    return this.pending
  }
}
