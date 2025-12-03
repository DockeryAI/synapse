/**
 * BR3 Browser Logger Vite Plugin
 *
 * Adds /api/br-logger endpoint to Vite dev server for log ingestion.
 * Writes logs to .buildrunner/browser.log
 *
 * Usage in vite.config.ts:
 *
 * import { brLoggerPlugin } from './.buildrunner/components/vite-br-logger-plugin'
 *
 * export default defineConfig({
 *   plugins: [react(), brLoggerPlugin()],
 * })
 */

import type { Plugin } from 'vite'
import fs from 'fs'
import path from 'path'

const LOG_DIR = '.buildrunner'
const LOG_FILE = 'browser.log'
const MAX_FILE_SIZE = 1024 * 1024 // 1MB
const MAX_ROTATIONS = 3

interface LogEntry {
  timestamp: string
  sessionId: string
  type: 'console' | 'network' | 'error'
  level?: string
  method?: string
  url?: string
  status?: number
  duration?: number
  message?: string
  stack?: string
  request?: unknown
  response?: unknown
  args?: unknown[]
}

function ensureLogDir(projectRoot: string): string {
  const logDir = path.join(projectRoot, LOG_DIR)
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true })
  }
  return logDir
}

function getFileSize(filePath: string): number {
  try {
    const stats = fs.statSync(filePath)
    return stats.size
  } catch {
    return 0
  }
}

function rotateLogsIfNeeded(logPath: string) {
  const size = getFileSize(logPath)

  if (size >= MAX_FILE_SIZE) {
    // Rotate existing logs
    for (let i = MAX_ROTATIONS - 1; i >= 1; i--) {
      const oldPath = `${logPath}.${i}`
      const newPath = `${logPath}.${i + 1}`
      try {
        if (fs.existsSync(oldPath)) {
          fs.renameSync(oldPath, newPath)
        }
      } catch {
        // Ignore rotation errors
      }
    }

    // Move current log to .1
    try {
      if (fs.existsSync(logPath)) {
        fs.renameSync(logPath, `${logPath}.1`)
      }
    } catch {
      // Ignore
    }

    // Delete oldest rotation
    try {
      const oldest = `${logPath}.${MAX_ROTATIONS + 1}`
      if (fs.existsSync(oldest)) {
        fs.unlinkSync(oldest)
      }
    } catch {
      // Ignore
    }
  }
}

function formatLogLine(entry: LogEntry): string {
  const { timestamp, sessionId, type, level, method, url, status, duration, message } = entry

  let prefix = `[${timestamp}] [${sessionId?.slice(0, 8) || '?'}]`

  if (type === 'console') {
    prefix += ` [${(level || 'log').toUpperCase()}]`
    return `${prefix} ${message || ''}`
  }

  if (type === 'network') {
    const statusStr = status ? ` ${status}` : ' ERR'
    const durationStr = duration ? ` ${duration}ms` : ''
    prefix += ` [NET]`
    return `${prefix} ${method} ${url}${statusStr}${durationStr}`
  }

  if (type === 'error') {
    prefix += ` [ERROR]`
    return `${prefix} ${message || 'Unknown error'}`
  }

  return `${prefix} ${JSON.stringify(entry)}`
}

export function brLoggerPlugin(): Plugin {
  let projectRoot: string

  return {
    name: 'br-logger',
    configResolved(config) {
      projectRoot = config.root
    },
    configureServer(server) {
      server.middlewares.use('/api/br-logger', async (req, res) => {
        // Only in development
        if (process.env.NODE_ENV === 'production') {
          res.statusCode = 403
          res.end(JSON.stringify({ error: 'Not available in production' }))
          return
        }

        // Handle GET (health check)
        if (req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({
            status: 'ok',
            message: 'BR3 Browser Logger API (Vite)',
            logFile: path.join(LOG_DIR, LOG_FILE),
          }))
          return
        }

        // Handle POST (log ingestion)
        if (req.method === 'POST') {
          let body = ''
          req.on('data', chunk => {
            body += chunk.toString()
          })
          req.on('end', () => {
            try {
              const data = JSON.parse(body)
              const logs: LogEntry[] = data.logs || []

              if (logs.length === 0) {
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ success: true, count: 0 }))
                return
              }

              const logDir = ensureLogDir(projectRoot)
              const logPath = path.join(logDir, LOG_FILE)

              rotateLogsIfNeeded(logPath)

              // Format and append logs
              const logLines = logs.map(entry => {
                const readable = formatLogLine(entry)
                const json = JSON.stringify(entry)
                return `${readable}\n  ${json}`
              }).join('\n') + '\n'

              fs.appendFileSync(logPath, logLines)

              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ success: true, count: logs.length }))
            } catch (error) {
              console.error('[BR3 Logger] Error writing logs:', error)
              res.statusCode = 500
              res.end(JSON.stringify({ error: 'Failed to write logs' }))
            }
          })
          return
        }

        // Other methods
        res.statusCode = 405
        res.end(JSON.stringify({ error: 'Method not allowed' }))
      })
    },
  }
}

export default brLoggerPlugin
