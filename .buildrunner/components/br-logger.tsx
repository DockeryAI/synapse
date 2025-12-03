'use client'

/**
 * BR3 Browser Logger
 *
 * Captures all console output and network requests for Claude to read.
 * Only active in development mode.
 *
 * Usage: Add <BRLogger /> to your root App component.
 *
 * For Vite: Uses the Vite dev server proxy or writes to a log endpoint
 * For Next.js: Uses /api/br-logger route
 */

import { useEffect, useRef } from 'react'

interface LogEntry {
  timestamp: string
  sessionId: string
  type: 'console' | 'network' | 'error'
  level?: 'log' | 'warn' | 'error' | 'info' | 'debug'
  method?: string
  url?: string
  status?: number
  duration?: number
  message?: string
  stack?: string
  request?: {
    method: string
    url: string
    headers?: Record<string, string>
    body?: unknown
  }
  response?: {
    status: number
    statusText: string
    headers?: Record<string, string>
    body?: unknown
  }
  args?: unknown[]
}

// Generate session ID once per page load
const SESSION_ID = typeof window !== 'undefined'
  ? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  : 'ssr'

// Buffer for batching logs
let logBuffer: LogEntry[] = []
let flushTimeout: ReturnType<typeof setTimeout> | null = null

const FLUSH_INTERVAL = 2000 // Flush every 2 seconds
const MAX_BUFFER_SIZE = 50 // Or when buffer hits 50 entries
const MAX_BODY_SIZE = 10000 // Truncate large request/response bodies

function truncate(value: unknown, maxLength: number = MAX_BODY_SIZE): unknown {
  if (typeof value === 'string' && value.length > maxLength) {
    return value.slice(0, maxLength) + `... [truncated ${value.length - maxLength} chars]`
  }
  if (typeof value === 'object' && value !== null) {
    try {
      const str = JSON.stringify(value)
      if (str.length > maxLength) {
        return str.slice(0, maxLength) + '...'
      }
      return value
    } catch {
      return '[Object]'
    }
  }
  return value
}

async function flushLogs() {
  if (logBuffer.length === 0) return

  const logsToSend = [...logBuffer]
  logBuffer = []

  try {
    // Try the API endpoint (works for Next.js and Vite with proxy)
    await fetch('/api/br-logger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logs: logsToSend }),
    })
  } catch {
    // Fallback: store in sessionStorage for manual retrieval
    try {
      const existing = sessionStorage.getItem('br3_logs') || '[]'
      const logs = JSON.parse(existing)
      logs.push(...logsToSend)
      // Keep only last 500 entries
      if (logs.length > 500) {
        logs.splice(0, logs.length - 500)
      }
      sessionStorage.setItem('br3_logs', JSON.stringify(logs))
    } catch {
      // Silently fail
    }
  }
}

function queueLog(entry: Omit<LogEntry, 'timestamp' | 'sessionId'>) {
  logBuffer.push({
    ...entry,
    timestamp: new Date().toISOString(),
    sessionId: SESSION_ID,
  })

  // Flush if buffer is full
  if (logBuffer.length >= MAX_BUFFER_SIZE) {
    flushLogs()
  } else if (!flushTimeout) {
    // Schedule flush
    flushTimeout = setTimeout(() => {
      flushTimeout = null
      flushLogs()
    }, FLUSH_INTERVAL)
  }
}

function interceptConsole() {
  const methods = ['log', 'warn', 'error', 'info', 'debug'] as const
  const original: Record<string, typeof console.log> = {}

  methods.forEach(method => {
    original[method] = console[method].bind(console)

    console[method] = (...args: unknown[]) => {
      // Call original
      original[method](...args)

      // Queue log entry
      queueLog({
        type: 'console',
        level: method,
        message: args.map(arg =>
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' '),
        args: args.map(arg => truncate(arg)),
      })
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

    // Skip logging our own logger requests
    if (url.includes('/api/br-logger') || url.includes('br3_logs')) {
      return originalFetch(input, init)
    }

    let requestBody: unknown = undefined
    if (init?.body) {
      try {
        requestBody = typeof init.body === 'string'
          ? JSON.parse(init.body)
          : init.body
      } catch {
        requestBody = String(init.body)
      }
    }

    try {
      const response = await originalFetch(input, init)
      const duration = Date.now() - startTime

      // Clone response to read body
      const clonedResponse = response.clone()
      let responseBody: unknown = undefined

      try {
        const contentType = response.headers.get('content-type')
        if (contentType?.includes('application/json')) {
          responseBody = await clonedResponse.json()
        } else {
          const text = await clonedResponse.text()
          responseBody = text.length > 1000 ? text.slice(0, 1000) + '...' : text
        }
      } catch {
        responseBody = '[Could not read response body]'
      }

      queueLog({
        type: 'network',
        method,
        url,
        status: response.status,
        duration,
        request: {
          method,
          url,
          headers: init?.headers as Record<string, string>,
          body: truncate(requestBody),
        },
        response: {
          status: response.status,
          statusText: response.statusText,
          body: truncate(responseBody),
        },
      })

      return response
    } catch (error) {
      const duration = Date.now() - startTime

      queueLog({
        type: 'network',
        method,
        url,
        duration,
        request: {
          method,
          url,
          headers: init?.headers as Record<string, string>,
          body: truncate(requestBody),
        },
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
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
    queueLog({
      type: 'error',
      level: 'error',
      message: event.message,
      stack: event.error?.stack,
    })
  }

  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    queueLog({
      type: 'error',
      level: 'error',
      message: `Unhandled Promise Rejection: ${event.reason}`,
      stack: event.reason?.stack,
    })
  }

  window.addEventListener('error', handleError)
  window.addEventListener('unhandledrejection', handleUnhandledRejection)

  return () => {
    window.removeEventListener('error', handleError)
    window.removeEventListener('unhandledrejection', handleUnhandledRejection)
  }
}

// Export logs from sessionStorage (for manual retrieval)
;(window as unknown as { br3ExportLogs: () => void }).br3ExportLogs = () => {
  const logs = sessionStorage.getItem('br3_logs') || '[]'
  console.log('[BR3] Logs:', JSON.parse(logs))
  return JSON.parse(logs)
}

export function BRLogger() {
  const initialized = useRef(false)

  useEffect(() => {
    // Only run in development
    if (import.meta.env?.MODE !== 'development' && process.env.NODE_ENV !== 'development') return

    // Only initialize once
    if (initialized.current) return
    initialized.current = true

    // Log session start
    queueLog({
      type: 'console',
      level: 'info',
      message: `[BR3] Browser logger started - Session: ${SESSION_ID}`,
    })

    // Set up interceptors
    const cleanupConsole = interceptConsole()
    const cleanupFetch = interceptFetch()
    const cleanupErrors = interceptErrors()

    // Flush on page unload
    const handleUnload = () => {
      flushLogs()
    }
    window.addEventListener('beforeunload', handleUnload)

    return () => {
      cleanupConsole()
      cleanupFetch()
      cleanupErrors()
      window.removeEventListener('beforeunload', handleUnload)
      flushLogs()
    }
  }, [])

  // Render nothing
  return null
}

export default BRLogger
