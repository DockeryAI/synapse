/**
 * Session Context
 * Provides global auto-save and session management across the app
 */

import * as React from 'react'
import { SessionService, BrandSession } from '@/services/session/session.service'
import { useBrand } from './BrandContext'

interface SessionContextValue {
  // Auto-save functionality
  autoSave: (data: { mirrorState?: any; uvpState?: any }) => Promise<void>
  lastSaved: Date | null
  isSaving: boolean

  // Session management
  currentSession: BrandSession | null
  loadSession: (urlSlug: string) => Promise<void>
  sessions: BrandSession[]
  refreshSessions: () => Promise<void>
  deleteSession: (sessionId: string) => Promise<void>

  // URL slug for current session
  urlSlug: string
  setUrlSlug: (slug: string) => void
}

const SessionContext = React.createContext<SessionContextValue | undefined>(undefined)

export const useSession = () => {
  const context = React.useContext(SessionContext)
  if (!context) {
    throw new Error('useSession must be used within SessionProvider')
  }
  return context
}

interface SessionProviderProps {
  children: React.ReactNode
}

export const SessionProvider: React.FC<SessionProviderProps> = ({ children }) => {
  const { currentBrand } = useBrand()
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)
  const [currentSession, setCurrentSession] = React.useState<BrandSession | null>(null)
  const [sessions, setSessions] = React.useState<BrandSession[]>([])
  const [urlSlug, setUrlSlug] = React.useState('')

  // Auto-save debounce timer
  const saveTimerRef = React.useRef<NodeJS.Timeout | null>(null)

  // Generate default URL slug from brand name
  React.useEffect(() => {
    if (currentBrand && !urlSlug) {
      const defaultSlug = SessionService.generateUrlSlug(currentBrand.name)
      setUrlSlug(defaultSlug)
    }
  }, [currentBrand, urlSlug])

  // Load sessions for current brand
  const refreshSessions = React.useCallback(async () => {
    if (!currentBrand?.id) return

    const loadedSessions = await SessionService.listSessions(currentBrand.id)
    setSessions(loadedSessions)
  }, [currentBrand?.id])

  // Load sessions on mount
  React.useEffect(() => {
    refreshSessions()
  }, [refreshSessions])

  // Auto-save with debouncing (wait 2 seconds after last change)
  const autoSave = React.useCallback(
    async (data: { mirrorState?: any; uvpState?: any }) => {
      if (!currentBrand?.id || !urlSlug) {
        console.warn('[SessionContext] Cannot auto-save: missing brand or URL slug')
        return
      }

      // Clear existing timer
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }

      // Set new timer
      saveTimerRef.current = setTimeout(async () => {
        setIsSaving(true)

        try {
          await SessionService.saveSession({
            brandId: currentBrand.id,
            sessionName: currentBrand.name,
            urlSlug,
            mirrorState: data.mirrorState,
            uvpState: data.uvpState,
          })

          setLastSaved(new Date())
          console.log('[SessionContext] Auto-save successful')
        } catch (error) {
          console.error('[SessionContext] Auto-save failed:', error)
        } finally {
          setIsSaving(false)
        }
      }, 2000) // 2 second debounce
    },
    [currentBrand, urlSlug]
  )

  // Load specific session
  const loadSession = React.useCallback(
    async (slug: string) => {
      if (!currentBrand?.id) return

      const session = await SessionService.loadSessionByBrand(currentBrand.id, slug)
      if (session) {
        setCurrentSession(session)
        setUrlSlug(session.url_slug)
        console.log('[SessionContext] Session loaded:', session.session_name)
      }
    },
    [currentBrand?.id]
  )

  // Delete session
  const deleteSession = React.useCallback(
    async (sessionId: string) => {
      await SessionService.deleteSession(sessionId)
      await refreshSessions()
      console.log('[SessionContext] Session deleted:', sessionId)
    },
    [refreshSessions]
  )

  // Cleanup timer on unmount
  React.useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
    }
  }, [])

  const value: SessionContextValue = {
    autoSave,
    lastSaved,
    isSaving,
    currentSession,
    loadSession,
    sessions,
    refreshSessions,
    deleteSession,
    urlSlug,
    setUrlSlug,
  }

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
