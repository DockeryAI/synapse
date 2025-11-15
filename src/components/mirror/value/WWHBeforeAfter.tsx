/**
 * WWHBeforeAfter Component
 * Fade transition showing transformation from generic WWH to enhanced WWH
 * Part of the big reveal sequence
 */

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Heart, Lightbulb, Package, ArrowRight, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { WWHEnhancedData } from '@/services/mirror/wwh-enhancer'

interface WWHBeforeAfterProps {
  data: WWHEnhancedData
  phase: 'before' | 'transition' | 'after'
  onTransitionComplete?: () => void
  className?: string
}

export const WWHBeforeAfter: React.FC<WWHBeforeAfterProps> = ({
  data,
  phase,
  onTransitionComplete,
  className,
}) => {
  const [currentPhase, setCurrentPhase] = React.useState<'before' | 'transition' | 'after'>(phase)

  React.useEffect(() => {
    setCurrentPhase(phase)
  }, [phase])

  // Trigger transition complete callback
  React.useEffect(() => {
    if (currentPhase === 'after' && onTransitionComplete) {
      const timer = setTimeout(() => {
        onTransitionComplete()
      }, 2000) // Wait for animations
      return () => clearTimeout(timer)
    }
  }, [currentPhase, onTransitionComplete])

  const showBefore = currentPhase === 'before' || currentPhase === 'transition'
  const showAfter = currentPhase === 'after' || currentPhase === 'transition'
  const isTransitioning = currentPhase === 'transition'

  return (
    <div className={cn('relative w-full max-w-4xl mx-auto', className)}>
      {/* Improvement Banner */}
      {currentPhase === 'after' && (
        <div className="mb-6 text-center animate-in fade-in slide-in-from-top duration-1000">
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 border-2 border-green-500 dark:border-green-600 rounded-full px-6 py-3">
            <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
            <div className="text-left">
              <p className="text-sm font-bold text-green-900 dark:text-green-100">
                {data.improvementScore}% Improvement
              </p>
              <p className="text-xs text-green-700 dark:text-green-300">
                +{data.clarityImprovement}% Clarity • +{data.specificityImprovement}% Specificity
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Before/After Container */}
      <div className="relative min-h-[600px]">
        {/* BEFORE State */}
        <div
          className={cn(
            'absolute inset-0 transition-all duration-1000',
            showBefore ? 'opacity-100' : 'opacity-0 pointer-events-none',
            isTransitioning && 'scale-95 blur-sm'
          )}
        >
          <div className="space-y-4">
            {/* Header */}
            <div className="text-center mb-6">
              <Badge variant="secondary" className="mb-2">Before</Badge>
              <h3 className="text-xl font-semibold text-muted-foreground">Generic WWH Framework</h3>
            </div>

            {/* WHY - Before */}
            <Card className="opacity-60">
              <CardHeader className="bg-yellow-50 dark:bg-yellow-950/10">
                <CardTitle className="text-base flex items-center gap-2">
                  <Heart className="h-4 w-4 text-yellow-600" />
                  WHY
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground italic">{data.originalWhy}</p>
              </CardContent>
            </Card>

            {/* HOW - Before */}
            <Card className="opacity-60">
              <CardHeader className="bg-blue-50 dark:bg-blue-950/10">
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-blue-600" />
                  HOW
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <ul className="space-y-1">
                  {data.originalHow.map((item, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground italic flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* WHAT - Before */}
            <Card className="opacity-60">
              <CardHeader className="bg-green-50 dark:bg-green-950/10">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4 text-green-600" />
                  WHAT
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <ul className="space-y-1">
                  {data.originalWhat.map((item, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground italic flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Transition Arrow */}
        {isTransitioning && (
          <div className="absolute inset-0 flex items-center justify-center z-10 animate-pulse">
            <div className="bg-white dark:bg-gray-900 rounded-full p-4 shadow-2xl border-4 border-blue-500">
              <ArrowRight className="h-12 w-12 text-blue-600" />
            </div>
          </div>
        )}

        {/* AFTER State */}
        <div
          className={cn(
            'absolute inset-0 transition-all duration-1000',
            showAfter ? 'opacity-100' : 'opacity-0 pointer-events-none',
            currentPhase === 'transition' && 'scale-105'
          )}
        >
          <div className="space-y-4">
            {/* Header */}
            <div className="text-center mb-6">
              <Badge className="mb-2 bg-gradient-to-r from-blue-600 to-indigo-600">After</Badge>
              <h3 className="text-xl font-bold">Enhanced WWH Framework</h3>
              <p className="text-sm text-muted-foreground">Powered by your UVP insights</p>
            </div>

            {/* WHY - After */}
            <Card className="border-2 border-yellow-200 dark:border-yellow-800 shadow-lg animate-in slide-in-from-left duration-500">
              <CardHeader className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20">
                <CardTitle className="text-base flex items-center gap-2">
                  <Heart className="h-5 w-5 text-yellow-600" />
                  WHY: Your Purpose
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-sm leading-relaxed font-medium">{data.enhancedWhy}</p>
              </CardContent>
            </Card>

            {/* HOW - After */}
            <Card className="border-2 border-blue-200 dark:border-blue-800 shadow-lg animate-in slide-in-from-left duration-500 delay-100">
              <CardHeader className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-blue-600" />
                  HOW: Your Unique Approach
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <ul className="space-y-2">
                  {data.enhancedHow.map((item, idx) => (
                    <li key={idx} className="text-sm leading-relaxed font-medium flex items-start gap-2">
                      <span className="h-2 w-2 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* WHAT - After */}
            <Card className="border-2 border-green-200 dark:border-green-800 shadow-lg animate-in slide-in-from-left duration-500 delay-200">
              <CardHeader className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-5 w-5 text-green-600" />
                  WHAT: Your Core Offerings
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <ul className="space-y-2">
                  {data.enhancedWhat.map((item, idx) => (
                    <li key={idx} className="text-sm leading-relaxed font-medium flex items-start gap-2">
                      <span className="h-2 w-2 rounded-full bg-green-600 mt-1.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
