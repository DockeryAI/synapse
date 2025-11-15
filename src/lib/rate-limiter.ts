/**
 * Client-side rate limiting
 * Following PATTERNS.md standards
 */

export class RateLimiter {
  private requests: number[] = []

  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}

  canMakeRequest(): boolean {
    const now = Date.now()
    this.requests = this.requests.filter(time => now - time < this.windowMs)
    return this.requests.length < this.maxRequests
  }

  recordRequest(): void {
    this.requests.push(Date.now())
  }

  async throttledRequest<T>(
    requestFn: () => Promise<T>
  ): Promise<T> {
    if (!this.canMakeRequest()) {
      throw new Error('Rate limit exceeded. Please try again later.')
    }

    this.recordRequest()
    return await requestFn()
  }

  reset(): void {
    this.requests = []
  }
}
