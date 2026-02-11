export class TTLCache<T> {
  private cache = new Map<string, { data: T; expires: number }>()

  constructor(private ttlMs: number = 30_000) {}

  get(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    if (Date.now() > entry.expires) {
      this.cache.delete(key)
      return null
    }
    return entry.data
  }

  set(key: string, data: T): void {
    this.cache.set(key, { data, expires: Date.now() + this.ttlMs })
  }

  invalidate(key?: string): void {
    if (key) {
      this.cache.delete(key)
    } else {
      this.cache.clear()
    }
  }
}
