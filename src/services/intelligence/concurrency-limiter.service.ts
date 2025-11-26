/**
 * Concurrency Limiter Service
 * Implements Netflix-style request queue management
 * Respects browser's 6-connection limit for HTTP/1.1
 */

interface QueueItem<T = any> {
  id: string
  priority: number
  execute: () => Promise<T>
  resolve: (value: T) => void
  reject: (error: any) => void
  timestamp: number
  retries?: number
}

export class ConcurrencyLimiter {
  private queue: QueueItem[] = []
  private activeRequests: Map<string, Promise<any>> = new Map()
  private maxConcurrent: number
  private requestCounter = 0

  constructor(maxConcurrent: number = 6) {
    this.maxConcurrent = maxConcurrent
  }

  /**
   * Execute function with concurrency limit
   * Higher priority = executed sooner (1 = highest)
   */
  async execute<T>(
    fn: () => Promise<T>,
    options?: {
      priority?: number
      id?: string
      retries?: number
    }
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const item: QueueItem<T> = {
        id: options?.id || `req-${++this.requestCounter}`,
        priority: options?.priority || 3,
        execute: fn,
        resolve,
        reject,
        timestamp: Date.now(),
        retries: options?.retries || 0
      }

      this.enqueue(item)
      this.processQueue()
    })
  }

  /**
   * Execute multiple functions with concurrency limit
   * Returns results as they complete (streaming)
   */
  async executeMany<T>(
    tasks: Array<{
      fn: () => Promise<T>
      priority?: number
      id?: string
    }>,
    onProgress?: (completed: number, total: number) => void
  ): Promise<T[]> {
    let completed = 0
    const total = tasks.length
    const results: T[] = []

    const promises = tasks.map(async (task, index) => {
      const result = await this.execute(task.fn, {
        priority: task.priority,
        id: task.id || `batch-${index}`
      })

      completed++
      onProgress?.(completed, total)

      return result
    })

    // Return results in order of completion (streaming)
    for await (const result of this.streamResults(promises)) {
      results.push(result)
    }

    return results
  }

  /**
   * Execute functions in priority groups
   * Each group runs in parallel, groups run sequentially
   */
  async executePhases<T>(
    phases: Array<{
      name: string
      tasks: Array<{
        fn: () => Promise<T>
        id: string
        priority?: number
      }>
      parallel?: boolean
    }>,
    onPhaseComplete?: (phase: string, results: T[]) => void
  ): Promise<Map<string, T[]>> {
    const allResults = new Map<string, T[]>()

    for (const phase of phases) {
      console.log(`[ConcurrencyLimiter] Starting phase: ${phase.name}`)

      let phaseResults: T[]

      if (phase.parallel !== false) {
        // Parallel execution within phase (default)
        const promises = phase.tasks.map(task =>
          this.execute(task.fn, {
            priority: task.priority || 2,
            id: `${phase.name}-${task.id}`
          })
        )

        phaseResults = await Promise.allSettled(promises).then(results =>
          results
            .filter(r => r.status === 'fulfilled')
            .map(r => (r as PromiseFulfilledResult<T>).value)
        )
      } else {
        // Sequential execution within phase
        phaseResults = []
        for (const task of phase.tasks) {
          try {
            const result = await this.execute(task.fn, {
              priority: task.priority || 2,
              id: `${phase.name}-${task.id}`
            })
            phaseResults.push(result)
          } catch (error) {
            console.error(`[ConcurrencyLimiter] Task failed in phase ${phase.name}:`, error)
          }
        }
      }

      allResults.set(phase.name, phaseResults)
      onPhaseComplete?.(phase.name, phaseResults)

      console.log(`[ConcurrencyLimiter] Completed phase: ${phase.name} with ${phaseResults.length} results`)
    }

    return allResults
  }

  /**
   * Get queue statistics
   */
  getStats(): {
    queued: number
    active: number
    maxConcurrent: number
    averageWaitTime: number
  } {
    const waitTimes = this.queue.map(item => Date.now() - item.timestamp)
    const avgWait = waitTimes.length > 0
      ? waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length
      : 0

    return {
      queued: this.queue.length,
      active: this.activeRequests.size,
      maxConcurrent: this.maxConcurrent,
      averageWaitTime: avgWait
    }
  }

  /**
   * Clear the queue
   */
  clear(): void {
    // Reject all queued items
    for (const item of this.queue) {
      item.reject(new Error('Queue cleared'))
    }
    this.queue = []
  }

  /**
   * Update max concurrent limit
   */
  setMaxConcurrent(max: number): void {
    this.maxConcurrent = max
    this.processQueue()
  }

  // Private methods

  private enqueue(item: QueueItem): void {
    // Insert based on priority (higher priority first)
    const insertIndex = this.queue.findIndex(
      existing => existing.priority < item.priority
    )

    if (insertIndex === -1) {
      this.queue.push(item)
    } else {
      this.queue.splice(insertIndex, 0, item)
    }
  }

  private async processQueue(): Promise<void> {
    while (
      this.queue.length > 0 &&
      this.activeRequests.size < this.maxConcurrent
    ) {
      const item = this.queue.shift()!

      const promise = this.executeItem(item)
      this.activeRequests.set(item.id, promise)

      // Clean up when done
      promise.finally(() => {
        this.activeRequests.delete(item.id)
        // Process next item
        this.processQueue()
      })
    }
  }

  private async executeItem<T>(item: QueueItem<T>): Promise<void> {
    try {
      const result = await item.execute()
      item.resolve(result)
    } catch (error) {
      // Retry logic
      if (item.retries && item.retries > 0) {
        item.retries--
        this.enqueue(item)
        console.log(`[ConcurrencyLimiter] Retrying ${item.id}, ${item.retries} attempts left`)
      } else {
        item.reject(error)
      }
    }
  }

  /**
   * Stream results as they complete
   */
  private async *streamResults<T>(promises: Promise<T>[]): AsyncGenerator<T> {
    const pending = new Set(promises.map((p, i) => i))
    const results = new Map<number, T>()

    // Create promise for each result
    const resultPromises = promises.map(async (promise, index) => {
      try {
        const result = await promise
        results.set(index, result)
        pending.delete(index)
        return { index, result }
      } catch (error) {
        pending.delete(index)
        throw { index, error }
      }
    })

    // Yield results as they complete
    while (pending.size > 0) {
      const { index, result } = await Promise.race(
        Array.from(pending).map(i =>
          resultPromises[i].then(r => r).catch(e => e)
        )
      )

      if (result !== undefined) {
        yield result
      }
    }
  }
}

// Create singleton instance for global use
export const concurrencyLimiter = new ConcurrencyLimiter(6)

// Create specialized limiters for different domains
export const edgeFunctionLimiter = new ConcurrencyLimiter(10) // Edge functions support more
export const cdnLimiter = new ConcurrencyLimiter(20) // CDN can handle many more

// Priority levels
export const Priority = {
  CRITICAL: 1,   // Phase 1: Critical context
  HIGH: 2,       // Phase 2: Psychological triggers
  MEDIUM: 3,     // Phase 3: Deep analysis
  LOW: 4,        // Phase 4: Industry-specific
  BACKGROUND: 5  // Background prefetching
} as const

export type PriorityLevel = typeof Priority[keyof typeof Priority]