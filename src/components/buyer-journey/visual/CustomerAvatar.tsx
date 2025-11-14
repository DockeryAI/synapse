/**
 * Customer Avatar Component
 * Shows customer persona in center with key traits orbiting around
 * Smooth fade-in animations and orbital motion
 */

import React, { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import type { CustomerPersona } from '@/types/buyer-journey'

interface CustomerAvatarProps {
  persona: CustomerPersona
  size?: 'sm' | 'md' | 'lg'
  showOrbits?: boolean
  animated?: boolean
  className?: string
}

export const CustomerAvatar: React.FC<CustomerAvatarProps> = ({
  persona,
  size = 'md',
  showOrbits = true,
  animated = true,
  className,
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [visibleTraits, setVisibleTraits] = useState<Set<number>>(new Set())

  // Animate avatar appearing
  useEffect(() => {
    if (animated) {
      const timeout = setTimeout(() => setIsVisible(true), 100)
      return () => clearTimeout(timeout)
    } else {
      setIsVisible(true)
    }
  }, [animated])

  // Animate traits appearing one by one
  useEffect(() => {
    if (!showOrbits || !animated) {
      setVisibleTraits(new Set(persona.key_traits.map((_, i) => i)))
      return
    }

    let timeout: NodeJS.Timeout

    if (visibleTraits.size < persona.key_traits.length) {
      timeout = setTimeout(() => {
        setVisibleTraits((prev) => new Set([...prev, visibleTraits.size]))
      }, 300)
    }

    return () => clearTimeout(timeout)
  }, [visibleTraits.size, persona.key_traits.length, showOrbits, animated])

  // Size configurations
  const sizeClasses = {
    sm: {
      avatar: 'w-16 h-16',
      orbit: 'w-32 h-32',
      badge: 'text-[10px] px-2 py-0.5',
    },
    md: {
      avatar: 'w-24 h-24',
      orbit: 'w-48 h-48',
      badge: 'text-xs px-2 py-1',
    },
    lg: {
      avatar: 'w-32 h-32',
      orbit: 'w-64 h-64',
      badge: 'text-sm px-3 py-1',
    },
  }

  const sizes = sizeClasses[size]

  // Calculate orbital positions for traits
  const getOrbitPosition = (index: number, total: number) => {
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2 // Start from top
    const radius = 40 // Percentage from center
    return {
      x: 50 + radius * Math.cos(angle),
      y: 50 + radius * Math.sin(angle),
      angle,
    }
  }

  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      {/* Orbital Container */}
      {showOrbits && (
        <div className={cn('relative', sizes.orbit)}>
          {/* Orbital Ring (subtle) */}
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-gray-200 dark:border-gray-700 opacity-30" />

          {/* Orbiting Traits */}
          {persona.key_traits.map((trait, index) => {
            const position = getOrbitPosition(index, persona.key_traits.length)
            const isTraitVisible = visibleTraits.has(index)

            return (
              <div
                key={index}
                className={cn(
                  'absolute transition-all duration-500',
                  !isTraitVisible && 'opacity-0 scale-50'
                )}
                style={{
                  left: `${position.x}%`,
                  top: `${position.y}%`,
                  transform: 'translate(-50%, -50%)',
                  transitionDelay: `${index * 100}ms`,
                }}
              >
                <Badge
                  variant="secondary"
                  className={cn(
                    sizes.badge,
                    'shadow-md whitespace-nowrap font-medium',
                    'bg-white dark:bg-gray-800 border-2',
                    animated && 'animate-in fade-in-0 zoom-in-95'
                  )}
                  style={{
                    borderColor: persona.avatar_color,
                    color: persona.avatar_color,
                  }}
                >
                  {trait}
                </Badge>

                {/* Connecting line to center (optional) */}
                {index === 0 && animated && (
                  <svg
                    className="absolute top-1/2 left-1/2 -z-10 pointer-events-none"
                    style={{
                      width: '200%',
                      height: '200%',
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <line
                      x1="50%"
                      y1="50%"
                      x2={`${((position.x - 50) / 2) * 100}%`}
                      y2={`${((position.y - 50) / 2) * 100}%`}
                      stroke={persona.avatar_color}
                      strokeWidth="1"
                      strokeOpacity="0.2"
                      strokeDasharray="4 4"
                    />
                  </svg>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Center Avatar */}
      <div
        className={cn(
          'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
          'rounded-full flex flex-col items-center justify-center',
          'border-4 border-white dark:border-gray-900 shadow-2xl',
          'transition-all duration-500',
          sizes.avatar,
          !isVisible && 'opacity-0 scale-0'
        )}
        style={{
          backgroundColor: persona.avatar_color,
        }}
      >
        {/* Avatar Content */}
        <div className="text-white text-center">
          <div className="text-3xl mb-1">👤</div>
        </div>

        {/* Pulse effect */}
        {animated && isVisible && (
          <div
            className="absolute inset-0 rounded-full animate-ping opacity-20"
            style={{
              backgroundColor: persona.avatar_color,
              animationDuration: '2s',
            }}
          />
        )}
      </div>

      {/* Persona Name Label */}
      <div
        className={cn(
          'absolute -bottom-16 left-1/2 -translate-x-1/2 text-center',
          'transition-all duration-500 delay-300',
          !isVisible && 'opacity-0 translate-y-4'
        )}
      >
        <div className="text-lg font-bold" style={{ color: persona.avatar_color }}>
          {persona.name}
        </div>
        <div className="text-sm text-muted-foreground max-w-[200px]">
          {persona.quick_description}
        </div>
      </div>
    </div>
  )
}

/**
 * Minimal Customer Avatar (for compact views)
 */
interface MinimalCustomerAvatarProps {
  persona: CustomerPersona
  size?: number
  showName?: boolean
  className?: string
}

export const MinimalCustomerAvatar: React.FC<MinimalCustomerAvatarProps> = ({
  persona,
  size = 40,
  showName = false,
  className,
}) => {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div
        className="rounded-full flex items-center justify-center border-2 border-white shadow-lg flex-shrink-0"
        style={{
          width: size,
          height: size,
          backgroundColor: persona.avatar_color,
        }}
      >
        <span className="text-white" style={{ fontSize: size * 0.5 }}>
          👤
        </span>
      </div>

      {showName && (
        <div>
          <div className="text-sm font-semibold" style={{ color: persona.avatar_color }}>
            {persona.name}
          </div>
          <div className="text-xs text-muted-foreground">{persona.demographics.age_range}</div>
        </div>
      )}
    </div>
  )
}
