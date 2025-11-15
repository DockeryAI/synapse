/**
 * Debugging and logging utilities
 * Following PATTERNS.md standards
 */

/**
 * Detailed logging with context and timestamp
 */
export function log(context: string, data: any, level: 'info' | 'warn' | 'error' = 'info'): void {
  const timestamp = new Date().toISOString()
  const message = `[${timestamp}] [${level.toUpperCase()}] [${context}]`

  if (level === 'error') {
    console.error(message, data)
  } else if (level === 'warn') {
    console.warn(message, data)
  } else {
    console.log(message, data)
  }
}

/**
 * Time an async operation and log the duration
 */
export async function timeOperation<T>(
  name: string,
  operation: () => Promise<T>
): Promise<T> {
  const start = performance.now()
  try {
    const result = await operation()
    const duration = performance.now() - start
    console.log(`${name} completed in ${duration.toFixed(2)}ms`)
    return result
  } catch (error) {
    const duration = performance.now() - start
    console.error(`${name} failed after ${duration.toFixed(2)}ms`, error)
    throw error
  }
}
