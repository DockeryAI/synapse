/**
 * Animated Journey Timeline
 * Horizontal timeline that draws itself with smooth animations
 * Shows 5 journey stages: Discover → Research → Decide → Buy → Love
 */

import React, { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import {
  Search,
  BookOpen,
  CheckCircle2,
  ShoppingCart,
  Heart,
  type LucideIcon,
} from 'lucide-react'
import type { SimpleStageDetails, SimpleJourneyStage } from '@/types/buyer-journey'

interface AnimatedJourneyTimelineProps {
  stages: SimpleStageDetails[]
  currentStage?: SimpleJourneyStage
  completedStages?: SimpleJourneyStage[]
  onStageClick?: (stage: SimpleJourneyStage) => void
  showAvatar?: boolean
  className?: string
}

const STAGE_ICONS: Record<SimpleJourneyStage, LucideIcon> = {
  discover: Search,
  research: BookOpen,
  decide: CheckCircle2,
  buy: ShoppingCart,
  love: Heart,
}

export const AnimatedJourneyTimeline: React.FC<AnimatedJourneyTimelineProps> = ({
  stages,
  currentStage,
  completedStages = [],
  onStageClick,
  showAvatar = false,
  className,
}) => {
  const [animationProgress, setAnimationProgress] = useState(0)
  const [visibleStages, setVisibleStages] = useState<Set<SimpleJourneyStage>>(new Set())

  // Animate stages appearing one by one
  useEffect(() => {
    let timeout: NodeJS.Timeout

    if (animationProgress < stages.length) {
      timeout = setTimeout(() => {
        setVisibleStages((prev) => new Set([...prev, stages[animationProgress].stage]))
        setAnimationProgress((prev) => prev + 1)
      }, 200) // 200ms delay between each stage
    }

    return () => clearTimeout(timeout)
  }, [animationProgress, stages])

  // Calculate progress percentage for line animation
  const lineProgress = (animationProgress / Math.max(1, stages.length - 1)) * 100

  return (
    <div className={cn('relative', className)}>
      {/* Timeline Container */}
      <div className="relative px-8 py-6">
        {/* Background Line */}
        <div className="absolute left-8 right-8 top-[50%] h-1 bg-gray-200 dark:bg-gray-700 -translate-y-1/2" />

        {/* Animated Progress Line */}
        <div
          className="absolute left-8 right-8 top-[50%] h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 -translate-y-1/2 transition-all duration-500 ease-out"
          style={{
            clipPath: `polygon(0 0, ${lineProgress}% 0, ${lineProgress}% 100%, 0 100%)`,
          }}
        />

        {/* Stages */}
        <div className="relative flex justify-between items-center">
          {stages.map((stage, index) => {
            const Icon = STAGE_ICONS[stage.stage]
            const isVisible = visibleStages.has(stage.stage)
            const isCurrent = currentStage === stage.stage
            const isCompleted = completedStages.includes(stage.stage)
            const isClickable = !!onStageClick

            return (
              <button
                key={stage.stage}
                onClick={() => isClickable && onStageClick(stage.stage)}
                disabled={!isClickable}
                className={cn(
                  'relative flex flex-col items-center gap-2 transition-all duration-300',
                  isClickable && 'cursor-pointer hover:scale-110',
                  !isClickable && 'cursor-default',
                  !isVisible && 'opacity-0 scale-50'
                )}
                style={{
                  transitionDelay: `${index * 50}ms`,
                }}
              >
                {/* Stage Circle */}
                <div
                  className={cn(
                    'relative z-10 w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300',
                    'border-4 border-white dark:border-gray-900 shadow-lg',
                    isCurrent && 'ring-4 ring-offset-2',
                    isCompleted && 'scale-110'
                  )}
                  style={{
                    backgroundColor: stage.color,
                    ringColor: isCurrent ? stage.color : undefined,
                  }}
                >
                  <Icon className="h-8 w-8 text-white" />

                  {/* Pulse animation for current stage */}
                  {isCurrent && (
                    <div
                      className="absolute inset-0 rounded-full animate-ping opacity-75"
                      style={{ backgroundColor: stage.color }}
                    />
                  )}

                  {/* Checkmark for completed stages */}
                  {isCompleted && !isCurrent && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                      <CheckCircle2 className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>

                {/* Stage Label */}
                <div className="text-center">
                  <div
                    className={cn(
                      'text-sm font-semibold transition-colors',
                      isCurrent && 'scale-110',
                      isCompleted && 'text-green-600 dark:text-green-400'
                    )}
                    style={{
                      color: isCurrent ? stage.color : undefined,
                    }}
                  >
                    {stage.label}
                  </div>
                  {stage.key_concern && (
                    <div className="text-xs text-muted-foreground mt-1 max-w-[100px] truncate">
                      {stage.key_concern}
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Walking Avatar (optional) */}
      {showAvatar && currentStage && (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <WalkingAvatar
            stages={stages}
            currentStage={currentStage}
            completedStages={completedStages}
          />
        </div>
      )}
    </div>
  )
}

/**
 * Walking Avatar Component
 * Shows a customer avatar that "walks" along the journey
 */
interface WalkingAvatarProps {
  stages: SimpleStageDetails[]
  currentStage: SimpleJourneyStage
  completedStages: SimpleJourneyStage[]
}

const WalkingAvatar: React.FC<WalkingAvatarProps> = ({
  stages,
  currentStage,
  completedStages,
}) => {
  const currentIndex = stages.findIndex((s) => s.stage === currentStage)
  const progress = currentIndex === -1 ? 0 : (currentIndex / (stages.length - 1)) * 100

  return (
    <div
      className="absolute top-[10%] transition-all duration-1000 ease-out"
      style={{
        left: `${progress}%`,
        transform: 'translateX(-50%)',
      }}
    >
      <div className="relative">
        {/* Avatar Circle */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 border-4 border-white shadow-lg flex items-center justify-center">
          <span className="text-xl">👤</span>
        </div>

        {/* Walking indicator */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
          <div className="flex gap-0.5">
            <div className="w-1 h-1 rounded-full bg-amber-500 animate-bounce" />
            <div
              className="w-1 h-1 rounded-full bg-amber-500 animate-bounce"
              style={{ animationDelay: '0.1s' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
