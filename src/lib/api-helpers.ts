/**
 * API Helper functions following PATTERNS.md standards
 */

/**
 * Call API with automatic retry and exponential backoff
 */
export async function callAPIWithRetry<T>(
  apiCall: () => Promise<T>,
  options: {
    maxRetries?: number
    fallbackValue?: T
    onError?: (error: Error) => void
  } = {}
): Promise<T> {
  const { maxRetries = 3, fallbackValue, onError } = options

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall()
    } catch (error) {
      if (attempt === maxRetries) {
        onError?.(error as Error)
        if (fallbackValue !== undefined) return fallbackValue
        throw new Error(`API call failed after ${maxRetries} attempts: ${error}`)
      }
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
    }
  }
  throw new Error('Unreachable')
}

/**
 * Execute multiple API calls in parallel with timeout and partial failure handling
 */
export async function parallelAPICalls<T>(
  calls: Array<() => Promise<T>>,
  options: {
    timeout?: number
    allowPartialFailure?: boolean
  } = {}
): Promise<T[]> {
  const { timeout = 30000, allowPartialFailure = true } = options

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), timeout)
  )

  try {
    if (allowPartialFailure) {
      const results = await Promise.allSettled(
        calls.map(call => Promise.race([call(), timeoutPromise]))
      )
      return results
        .filter(r => r.status === 'fulfilled')
        .map(r => (r as PromiseFulfilledResult<T>).value)
    } else {
      return await Promise.all(
        calls.map(call => Promise.race([call(), timeoutPromise]))
      )
    }
  } catch (error) {
    console.error('Parallel API calls failed:', error)
    throw error
  }
}
