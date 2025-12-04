/**
 * BR3 Browser Logger for Vite
 * Auto-generated - captures console, network, and errors for /dbg command
 */

interface LogEntry {
  timestamp: string
  sessionId: string
  type: 'LOG' | 'WARN' | 'ERROR' | 'INFO' | 'DEBUG' | 'NET'
  message: string
  details?: unknown
}

const SESSION_ID = typeof window !== 'undefined'
  ? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
  : 'ssr'

let logBuffer: LogEntry[] = []
let flushTimeout: ReturnType<typeof setTimeout> | null = null
let initialized = false

const FLUSH_INTERVAL = 1000
const MAX_BUFFER_SIZE = 20

function formatEntry(entry: LogEntry): string {
  const time = entry.timestamp.split('T')[1]?.split('.')[0] || entry.timestamp
  let line = `[${time}] [${entry.sessionId}] [${entry.type}] ${entry.message}`
  if (entry.details) {
    try {
      line += `\n  ${JSON.stringify(entry.details, null, 2).split('\n').join('\n  ')}`
    } catch {
      line += `\n  [unserializable]`
    }
  }
  return line
}

async function flushLogs() {
  if (logBuffer.length === 0) return
  const logsToSend = [...logBuffer]
  logBuffer = []
  try {
    await fetch('/__br_logger', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: logsToSend.map(formatEntry).join('\n') + '\n',
    })
  } catch {}
}

function queueLog(type: LogEntry['type'], message: string, details?: unknown) {
  if (typeof window === 'undefined') return
  logBuffer.push({ timestamp: new Date().toISOString(), sessionId: SESSION_ID, type, message, details })
  if (logBuffer.length >= MAX_BUFFER_SIZE) {
    flushLogs()
  } else if (!flushTimeout) {
    flushTimeout = setTimeout(() => { flushTimeout = null; flushLogs() }, FLUSH_INTERVAL)
  }
}

function truncate(body: unknown, max = 2000): unknown {
  if (typeof body === 'string') return body.length > max ? body.slice(0, max) + '...' : body
  if (typeof body === 'object' && body !== null) {
    try {
      const s = JSON.stringify(body)
      return s.length > max ? s.slice(0, max) + '...' : body
    } catch { return '[unserializable]' }
  }
  return body
}

function interceptConsole() {
  const methods = ['log', 'warn', 'error', 'info', 'debug'] as const
  const typeMap: Record<string, LogEntry['type']> = { log: 'LOG', warn: 'WARN', error: 'ERROR', info: 'INFO', debug: 'DEBUG' }
  const original: Record<string, typeof console.log> = {}
  methods.forEach(m => {
    original[m] = console[m].bind(console)
    console[m] = (...args: unknown[]) => {
      original[m](...args)
      queueLog(typeMap[m], args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '))
    }
  })
  return () => methods.forEach(m => { console[m] = original[m] })
}

function interceptFetch() {
  const orig = window.fetch.bind(window)
  window.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    if (url.includes('__br_logger')) return orig(input, init)
    const method = init?.method || 'GET'
    const start = Date.now()
    let reqBody: unknown
    if (init?.body) { try { reqBody = JSON.parse(init.body as string) } catch { reqBody = String(init.body).slice(0, 500) } }
    try {
      const res = await orig(input, init)
      const dur = Date.now() - start
      let resBody: unknown
      try { resBody = res.headers.get('content-type')?.includes('json') ? await res.clone().json() : await res.clone().text() } catch { resBody = '[unreadable]' }
      queueLog('NET', `${res.status >= 400 ? 'ERR' : 'OK'} ${method} ${url} ${res.status} (${dur}ms)`, { request: truncate(reqBody), response: truncate(resBody) })
      return res
    } catch (e) {
      queueLog('NET', `FAIL ${method} ${url} (${Date.now() - start}ms)`, { request: truncate(reqBody), error: e instanceof Error ? e.message : String(e) })
      throw e
    }
  }
  return () => { window.fetch = orig }
}

function interceptErrors() {
  const onErr = (e: ErrorEvent) => queueLog('ERROR', `Uncaught: ${e.message}`, { file: e.filename, line: e.lineno, stack: e.error?.stack })
  const onRej = (e: PromiseRejectionEvent) => queueLog('ERROR', `Unhandled: ${e.reason}`, { stack: e.reason?.stack })
  window.addEventListener('error', onErr)
  window.addEventListener('unhandledrejection', onRej)
  return () => { window.removeEventListener('error', onErr); window.removeEventListener('unhandledrejection', onRej) }
}

export function initBRLogger() {
  if (typeof window === 'undefined' || initialized || import.meta.env.PROD) return
  initialized = true
  queueLog('INFO', `=== Session: ${SESSION_ID} ===`)
  const c1 = interceptConsole(), c2 = interceptFetch(), c3 = interceptErrors()
  window.addEventListener('beforeunload', flushLogs)
  return () => { c1(); c2(); c3(); window.removeEventListener('beforeunload', flushLogs); flushLogs() }
}
