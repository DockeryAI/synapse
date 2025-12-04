/**
 * BR3 Browser Logger - Universal
 *
 * Captures console output, network requests, and errors for debugging.
 * Works with Next.js, Vite, CRA, and any other React setup.
 *
 * Usage:
 *   - Next.js: Add <BRLogger /> to your root layout
 *   - Vite: Call initBRLogger() in main.tsx
 *
 * The logger auto-detects the framework and uses the appropriate endpoint.
 */

import { useEffect, useRef } from 'react'

interface LogEntry {
  timestamp: string
  sessionId: string
  type: 'LOG' | 'WARN' | 'ERROR' | 'INFO' | 'DEBUG' | 'NET'
  message: string
  details?: unknown
}

// Generate session ID once per page load
const SESSION_ID = typeof window !== 'undefined'
  ? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
  : 'ssr'

let logBuffer: LogEntry[] = []
let flushTimeout: ReturnType<typeof setTimeout> | null = null
let initialized = false

// Auto-detect endpoint based on framework
function getLoggerEndpoint(): string {
  // Vite uses /__br_logger (handled by vite plugin)
  // Next.js uses /api/br-logger (handled by API route)
  if (typeof window !== 'undefined') {
    // Check if we're in Vite by looking for Vite-specific globals
    if ((import.meta as any)?.env?.DEV !== undefined) {
      return '/__br_logger'
    }
  }
  return '/api/br-logger'
}

const FLUSH_INTERVAL = 1000
const MAX_BUFFER_SIZE = 20
const MAX_BODY_SIZE = 2000

function formatEntry(entry: LogEntry): string {
  const time = entry.timestamp.split('T')[1]?.split('.')[0] || entry.timestamp
  let line = `[${time}] [${entry.sessionId}] [${entry.type}] ${entry.message}`
  if (entry.details) {
    try {
      const detailStr = JSON.stringify(entry.details, null, 2)
      line += `\n  ${detailStr.split('\n').join('\n  ')}`
    } catch {
      line += `\n  [unserializable details]`
    }
  }
  return line
}

async function flushLogs() {
  if (logBuffer.length === 0) return

  const logsToSend = [...logBuffer]
  logBuffer = []

  const endpoint = getLoggerEndpoint()
  const isVite = endpoint === '/__br_logger'

  try {
    if (isVite) {
      // Vite: send plain text
      const formatted = logsToSend.map(formatEntry).join('\n') + '\n'
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: formatted,
      })
    } else {
      // Next.js: send JSON
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs: logsToSend }),
      })
    }
  } catch {
    // Silently fail - don't log errors about logging
  }
}

function queueLog(type: LogEntry['type'], message: string, details?: unknown) {
  if (typeof window === 'undefined') return

  logBuffer.push({
    timestamp: new Date().toISOString(),
    sessionId: SESSION_ID,
    type,
    message,
    details,
  })

  if (logBuffer.length >= MAX_BUFFER_SIZE) {
    flushLogs()
  } else if (!flushTimeout) {
    flushTimeout = setTimeout(() => {
      flushTimeout = null
      flushLogs()
    }, FLUSH_INTERVAL)
  }
}

function truncateBody(body: unknown, maxLen = MAX_BODY_SIZE): unknown {
  if (typeof body === 'string') {
    return body.length > maxLen ? body.slice(0, maxLen) + '...[truncated]' : body
  }
  if (typeof body === 'object' && body !== null) {
    try {
      const str = JSON.stringify(body)
      if (str.length > maxLen) {
        return str.slice(0, maxLen) + '...[truncated]'
      }
      return body
    } catch {
      return '[unserializable]'
    }
  }
  return body
}

function interceptConsole() {
  const methods = ['log', 'warn', 'error', 'info', 'debug'] as const
  const typeMap: Record<string, LogEntry['type']> = {
    log: 'LOG',
    warn: 'WARN',
    error: 'ERROR',
    info: 'INFO',
    debug: 'DEBUG',
  }
  const original: Record<string, typeof console.log> = {}

  methods.forEach(method => {
    original[method] = console[method].bind(console)
    console[method] = (...args: unknown[]) => {
      original[method](...args)

      const message = args.map(arg => {
        try {
          return typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        } catch {
          return '[unserializable]'
        }
      }).join(' ')

      queueLog(typeMap[method], message)
    }
  })

  return () => {
    methods.forEach(method => {
      console[method] = original[method]
    })
  }
}

function interceptFetch() {
  const originalFetch = window.fetch.bind(window)

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    const method = init?.method || 'GET'
    const startTime = Date.now()

    // Skip our own logger endpoints
    if (url.includes('__br_logger') || url.includes('/api/br-logger')) {
      return originalFetch(input, init)
    }

    let requestBody: unknown
    if (init?.body) {
      try {
        requestBody = typeof init.body === 'string' ? JSON.parse(init.body) : init.body
      } catch {
        requestBody = String(init.body).slice(0, 500)
      }
    }

    try {
      const response = await originalFetch(input, init)
      const duration = Date.now() - startTime
      const cloned = response.clone()

      let responseBody: unknown
      try {
        const ct = response.headers.get('content-type')
        if (ct?.includes('application/json')) {
          responseBody = await cloned.json()
        } else {
          responseBody = await cloned.text()
        }
      } catch {
        responseBody = '[unreadable]'
      }

      const status = response.status
      const statusIcon = status >= 400 ? 'ERR' : status >= 300 ? 'REDIR' : 'OK'

      queueLog('NET', `${statusIcon} ${method} ${url} ${status} (${duration}ms)`, {
        request: truncateBody(requestBody),
        response: truncateBody(responseBody),
      })

      return response
    } catch (error) {
      const duration = Date.now() - startTime
      queueLog('NET', `FAIL ${method} ${url} (${duration}ms)`, {
        request: truncateBody(requestBody),
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  return () => {
    window.fetch = originalFetch
  }
}

function interceptErrors() {
  const handleError = (event: ErrorEvent) => {
    queueLog('ERROR', `Uncaught: ${event.message}`, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack,
    })
  }

  const handleRejection = (event: PromiseRejectionEvent) => {
    queueLog('ERROR', `Unhandled Promise: ${event.reason}`, {
      stack: event.reason?.stack,
    })
  }

  window.addEventListener('error', handleError)
  window.addEventListener('unhandledrejection', handleRejection)

  return () => {
    window.removeEventListener('error', handleError)
    window.removeEventListener('unhandledrejection', handleRejection)
  }
}

function isDev(): boolean {
  // Check various ways to detect development mode
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
    return true
  }
  if ((import.meta as any)?.env?.DEV) {
    return true
  }
  if ((import.meta as any)?.env?.MODE === 'development') {
    return true
  }
  // Fallback: check if we're on localhost
  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    return host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.')
  }
  return false
}

/**
 * Initialize BR Logger (for Vite/non-React usage)
 * Call this once at app startup
 */
export function initBRLogger(): (() => void) | undefined {
  if (typeof window === 'undefined') return
  if (initialized) return
  if (!isDev()) return

  initialized = true

  queueLog('INFO', `=== Browser session started: ${SESSION_ID} ===`)

  const cleanupConsole = interceptConsole()
  const cleanupFetch = interceptFetch()
  const cleanupErrors = interceptErrors()

  window.addEventListener('beforeunload', flushLogs)

  return () => {
    cleanupConsole()
    cleanupFetch()
    cleanupErrors()
    window.removeEventListener('beforeunload', flushLogs)
    flushLogs()
  }
}

/**
 * BR Logger React Component (for Next.js usage)
 * Add <BRLogger /> to your root layout
 */
export function BRLogger() {
  const initRef = useRef(false)

  useEffect(() => {
    if (initRef.current) return
    initRef.current = true

    const cleanup = initBRLogger()
    return cleanup
  }, [])

  return null
}

export default BRLogger
