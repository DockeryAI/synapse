/**
 * Journey Stage Card Component
 * Individual card for each stage in the customer journey
 * States: locked, active, complete
 */

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { JourneyStage, Touchpoint, PainPoint } from '@/types/buyer-journey'
import {
  Lock,
  Eye,
  Search,
  ShoppingCart,
  CreditCard,
  Truck,
  Star,
  Heart,
  Check,
  AlertCircle,
  MapPin,
} from 'lucide-react'

export interface JourneyStageCardProps {
  stage: JourneyStage
  status: 'locked' | 'active' | 'complete'
  touchpoints?: Touchpoint[]
  painPoints?: PainPoint[]
  onClick?: () => void
}

const STAGE_CONFIG: Record<JourneyStage, {
  icon: React.ComponentType<{ className?: string }>
  label: string
  description: string
  color: string
}> = {
  awareness: {
    icon: Eye,
    label: 'Awareness',
    description: 'Discovering the need',
    color: 'blue',
  },
  consideration: {
    icon: Search,
    label: 'Consideration',
    description: 'Exploring options',
    color: 'purple',
  },
  decision: {
    icon: ShoppingCart,
    label: 'Decision',
    description: 'Evaluating & choosing',
    color: 'green',
  },
  purchase: {
    icon: CreditCard,
    label: 'Purchase',
    description: 'Buying & onboarding',
    color: 'orange',
  },
  delivery: {
    icon: Truck,
    label: 'Delivery',
    description: 'Receiving service',
    color: 'indigo',
  },
  'post-purchase': {
    icon: Star,
    label: 'Post-Purchase',
    description: 'After service complete',
    color: 'violet',
  },
  advocacy: {
    icon: Heart,
    label: 'Advocacy',
    description: 'Loyal & referring',
    color: 'pink',
  },
}

export const JourneyStageCard: React.FC<JourneyStageCardProps> = ({
  stage,
  status,
  touchpoints = [],
  painPoints = [],
  onClick,
}) => {
  const config = STAGE_CONFIG[stage]
  const Icon = config.icon

  const isInteractive = status !== 'locked' && onClick

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={cn(
          'relative overflow-hidden transition-all',
          status === 'locked' && 'opacity-50 cursor-not-allowed',
          status === 'active' && 'border-2 border-primary shadow-md',
          status === 'complete' && 'border-2 border-green-500/50 bg-green-500/5',
          isInteractive && 'cursor-pointer hover:shadow-lg hover:scale-[1.02]'
        )}
        onClick={() => isInteractive && onClick()}
      >
        {/* Status indicator */}
        <div className="absolute top-3 right-3">
          {status === 'locked' && (
            <Lock className="h-4 w-4 text-muted-foreground" />
          )}
          {status === 'active' && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <div className="h-2 w-2 rounded-full bg-primary" />
            </motion.div>
          )}
          {status === 'complete' && (
            <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
              <Check className="h-4 w-4 text-white" />
            </div>
          )}
        </div>

        <div className="p-4">
          {/* Stage header */}
          <div className="flex items-center gap-3 mb-3">
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center',
                status === 'locked' && 'bg-muted',
                status === 'active' && `bg-${config.color}-500/20`,
                status === 'complete' && 'bg-green-500/20'
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5',
                  status === 'locked' && 'text-muted-foreground',
                  status === 'active' && `text-${config.color}-600 dark:text-${config.color}-400`,
                  status === 'complete' && 'text-green-600 dark:text-green-400'
                )}
              />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm">{config.label}</h4>
              <p className="text-xs text-muted-foreground">{config.description}</p>
            </div>
          </div>

          {/* Data indicators - only show if not locked */}
          {status !== 'locked' && (touchpoints.length > 0 || painPoints.length > 0) && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
              {touchpoints.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  <MapPin className="h-3 w-3 mr-1" />
                  {touchpoints.length} touchpoint{touchpoints.length !== 1 ? 's' : ''}
                </Badge>
              )}
              {painPoints.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {painPoints.length} pain point{painPoints.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          )}

          {/* Locked message */}
          {status === 'locked' && (
            <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">
              Complete earlier steps to unlock
            </p>
          )}
        </div>

        {/* Active border animation */}
        {status === 'active' && (
          <motion.div
            className="absolute inset-0 border-2 border-primary rounded-lg pointer-events-none"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
        )}
      </Card>
    </motion.div>
  )
}
