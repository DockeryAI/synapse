import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Sparkles,
  TrendingUp,
  Calendar,
  BarChart3,
  Lightbulb,
  Target,
} from 'lucide-react'
import { useMarbs } from './MarbsContextProvider'
import { cn } from '@/lib/utils'

interface QuickAction {
  id: string
  label: string
  prompt: string
  icon: React.ReactNode
  category: string
}

interface MarbsQuickActionsProps {
  className?: string
  layout?: 'horizontal' | 'vertical' | 'grid'
}

export const MarbsQuickActions: React.FC<MarbsQuickActionsProps> = ({
  className,
  layout = 'horizontal',
}) => {
  const { sendMessage, capabilities, openMarbs } = useMarbs()

  // Generate quick actions based on available capabilities
  const quickActions = React.useMemo((): QuickAction[] => {
    const actions: QuickAction[] = []

    if (capabilities.some((c) => c.id.includes('analyze'))) {
      actions.push({
        id: 'analyze',
        label: 'Analyze',
        prompt: 'Analyze my current brand situation and suggest improvements',
        icon: <TrendingUp className="h-4 w-4" />,
        category: 'analysis',
      })
    }

    if (capabilities.some((c) => c.id.includes('content'))) {
      actions.push({
        id: 'generate',
        label: 'Generate',
        prompt: 'Generate content ideas for my next campaign',
        icon: <Sparkles className="h-4 w-4" />,
        category: 'generation',
      })
    }

    if (capabilities.some((c) => c.id.includes('calendar') || c.id.includes('schedule'))) {
      actions.push({
        id: 'schedule',
        label: 'Schedule',
        prompt: 'Help me plan my content calendar for next week',
        icon: <Calendar className="h-4 w-4" />,
        category: 'automation',
      })
    }

    if (capabilities.some((c) => c.id.includes('metrics') || c.id.includes('analytics'))) {
      actions.push({
        id: 'metrics',
        label: 'Metrics',
        prompt: 'Show me key performance metrics and insights',
        icon: <BarChart3 className="h-4 w-4" />,
        category: 'insight',
      })
    }

    if (capabilities.some((c) => c.id.includes('objective') || c.id.includes('goal'))) {
      actions.push({
        id: 'objectives',
        label: 'Objectives',
        prompt: 'Help me define my marketing objectives',
        icon: <Target className="h-4 w-4" />,
        category: 'optimization',
      })
    }

    if (capabilities.some((c) => c.id.includes('suggest') || c.id.includes('recommend'))) {
      actions.push({
        id: 'suggest',
        label: 'Suggestions',
        prompt: 'What should I focus on right now?',
        icon: <Lightbulb className="h-4 w-4" />,
        category: 'insight',
      })
    }

    return actions
  }, [capabilities])

  const handleQuickAction = async (action: QuickAction) => {
    openMarbs()
    await sendMessage(action.prompt)
  }

  if (quickActions.length === 0) return null

  return (
    <div
      className={cn(
        'flex gap-2',
        layout === 'vertical' && 'flex-col',
        layout === 'grid' && 'grid grid-cols-2 md:grid-cols-3 gap-2',
        className
      )}
    >
      {quickActions.map((action) => (
        <Button
          key={action.id}
          variant="outline"
          className={cn(
            'justify-start gap-2',
            layout === 'horizontal' && 'flex-1'
          )}
          onClick={() => handleQuickAction(action)}
        >
          {action.icon}
          <span>{action.label}</span>
        </Button>
      ))}
    </div>
  )
}
