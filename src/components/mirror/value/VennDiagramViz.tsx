/**
 * VennDiagramViz Component
 * Animated 3-circle Venn diagram showing Problem/Solution/Outcome sweet spot
 * Part of the big reveal sequence
 */

import * as React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle, Lightbulb, Target } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VennDiagramVizProps {
  problem: string
  solution: string
  outcome: string
  animate?: boolean
  showLabels?: boolean
  className?: string
}

export const VennDiagramViz: React.FC<VennDiagramVizProps> = ({
  problem,
  solution,
  outcome,
  animate = true,
  showLabels = true,
  className,
}) => {
  const [isAnimated, setIsAnimated] = React.useState(false)

  React.useEffect(() => {
    if (animate) {
      setTimeout(() => setIsAnimated(true), 100)
    } else {
      setIsAnimated(true)
    }
  }, [animate])

  return (
    <div className={cn('w-full', className)}>
      {/* Diagram Container */}
      <div className="relative w-full aspect-square max-w-2xl mx-auto">
        {/* SVG Venn Diagram */}
        <svg viewBox="0 0 400 400" className="w-full h-full">
          {/* Define gradients */}
          <defs>
            <radialGradient id="problemGradient">
              <stop offset="0%" stopColor="rgb(254, 202, 202)" stopOpacity="0.7" />
              <stop offset="100%" stopColor="rgb(252, 165, 165)" stopOpacity="0.4" />
            </radialGradient>
            <radialGradient id="solutionGradient">
              <stop offset="0%" stopColor="rgb(191, 219, 254)" stopOpacity="0.7" />
              <stop offset="100%" stopColor="rgb(147, 197, 253)" stopOpacity="0.4" />
            </radialGradient>
            <radialGradient id="outcomeGradient">
              <stop offset="0%" stopColor="rgb(187, 247, 208)" stopOpacity="0.7" />
              <stop offset="100%" stopColor="rgb(134, 239, 172)" stopOpacity="0.4" />
            </radialGradient>
          </defs>

          {/* Problem Circle (Red - Top) */}
          <circle
            cx="200"
            cy="140"
            r="90"
            fill="url(#problemGradient)"
            stroke="rgb(239, 68, 68)"
            strokeWidth="2"
            className={cn(
              'transition-all duration-1000',
              isAnimated ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
            )}
            style={{ transformOrigin: '200px 140px' }}
          />

          {/* Solution Circle (Blue - Bottom Left) */}
          <circle
            cx="155"
            cy="220"
            r="90"
            fill="url(#solutionGradient)"
            stroke="rgb(59, 130, 246)"
            strokeWidth="2"
            className={cn(
              'transition-all duration-1000 delay-300',
              isAnimated ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
            )}
            style={{ transformOrigin: '155px 220px' }}
          />

          {/* Outcome Circle (Green - Bottom Right) */}
          <circle
            cx="245"
            cy="220"
            r="90"
            fill="url(#outcomeGradient)"
            stroke="rgb(34, 197, 94)"
            strokeWidth="2"
            className={cn(
              'transition-all duration-1000 delay-500',
              isAnimated ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
            )}
            style={{ transformOrigin: '245px 220px' }}
          />

          {/* Center Sweet Spot (where all three overlap) */}
          <circle
            cx="200"
            cy="193"
            r="25"
            fill="rgb(251, 191, 36)"
            fillOpacity="0.9"
            stroke="rgb(217, 119, 6)"
            strokeWidth="3"
            className={cn(
              'transition-all duration-1000 delay-1000',
              isAnimated ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
            )}
            style={{ transformOrigin: '200px 193px' }}
          />

          {/* Star in center to emphasize sweet spot */}
          <g
            className={cn(
              'transition-all duration-500 delay-1500',
              isAnimated ? 'opacity-100' : 'opacity-0'
            )}
          >
            <path
              d="M200,180 L202,188 L210,188 L204,193 L206,201 L200,196 L194,201 L196,193 L190,188 L198,188 Z"
              fill="white"
              stroke="rgb(217, 119, 6)"
              strokeWidth="1"
            />
          </g>
        </svg>

        {/* Floating Labels */}
        {showLabels && (
          <>
            {/* Problem Label */}
            <div
              className={cn(
                'absolute top-[5%] left-1/2 -translate-x-1/2 transition-all duration-1000',
                isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
              )}
            >
              <div className="flex flex-col items-center gap-2">
                <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-2 border-2 border-red-500">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div className="text-center bg-white dark:bg-gray-900 rounded-lg shadow-lg px-3 py-1.5 border">
                  <p className="text-xs font-semibold text-red-700 dark:text-red-400">PROBLEM</p>
                  <p className="text-xs text-muted-foreground max-w-[150px] truncate">{problem}</p>
                </div>
              </div>
            </div>

            {/* Solution Label */}
            <div
              className={cn(
                'absolute bottom-[15%] left-[10%] transition-all duration-1000 delay-300',
                isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              )}
            >
              <div className="flex flex-col items-center gap-2">
                <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-2 border-2 border-blue-500">
                  <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-center bg-white dark:bg-gray-900 rounded-lg shadow-lg px-3 py-1.5 border">
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">SOLUTION</p>
                  <p className="text-xs text-muted-foreground max-w-[150px] truncate">{solution}</p>
                </div>
              </div>
            </div>

            {/* Outcome Label */}
            <div
              className={cn(
                'absolute bottom-[15%] right-[10%] transition-all duration-1000 delay-500',
                isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              )}
            >
              <div className="flex flex-col items-center gap-2">
                <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-2 border-2 border-green-500">
                  <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-center bg-white dark:bg-gray-900 rounded-lg shadow-lg px-3 py-1.5 border">
                  <p className="text-xs font-semibold text-green-700 dark:text-green-400">OUTCOME</p>
                  <p className="text-xs text-muted-foreground max-w-[150px] truncate">{outcome}</p>
                </div>
              </div>
            </div>

            {/* Sweet Spot Label */}
            <div
              className={cn(
                'absolute top-[48%] left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 delay-1000',
                isAnimated ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
              )}
            >
              <div className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white font-bold text-xs px-4 py-2 rounded-full shadow-lg border-2 border-yellow-600 animate-pulse">
                YOUR UVP
              </div>
            </div>
          </>
        )}
      </div>

      {/* Explanation */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <p className="text-sm text-center text-muted-foreground leading-relaxed">
            Your UVP lives at the intersection where <strong className="text-red-600 dark:text-red-400">customer problems</strong>,{' '}
            <strong className="text-blue-600 dark:text-blue-400">your unique solution</strong>, and{' '}
            <strong className="text-green-600 dark:text-green-400">measurable outcomes</strong> all converge. This is your sweet spot.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
