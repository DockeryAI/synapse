/**
 * Horizontal subsection tabs for MIRROR sections
 * Displays subsections as tabs above content area
 */

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Lock } from 'lucide-react'

interface Subsection {
  id: string
  label: string
  locked?: boolean
  badge?: React.ReactNode
}

interface SubsectionTabsProps {
  subsections: Subsection[]
  activeSubsection: string
  onSubsectionChange: (id: string) => void
  className?: string
}

export const SubsectionTabs: React.FC<SubsectionTabsProps> = ({
  subsections,
  activeSubsection,
  onSubsectionChange,
  className
}) => {
  return (
    <div className={cn('border-b bg-card/50', className)}>
      <div className="container px-6">
        <nav className="flex gap-1 -mb-px overflow-x-auto scrollbar-hide">
          {subsections.map((subsection) => {
            const isActive = activeSubsection === subsection.id
            const isLocked = subsection.locked

            return (
              <button
                key={subsection.id}
                onClick={() => !isLocked && onSubsectionChange(subsection.id)}
                disabled={isLocked}
                className={cn(
                  'relative flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2',
                  isActive
                    ? 'border-primary text-primary'
                    : isLocked
                    ? 'border-transparent text-muted-foreground/50 cursor-not-allowed'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
                )}
              >
                {isLocked && <Lock className="h-3 w-3" />}
                <span>{subsection.label}</span>
                {subsection.badge && (
                  <span className="ml-1">{subsection.badge}</span>
                )}

                {/* Active indicator */}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                )}
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
