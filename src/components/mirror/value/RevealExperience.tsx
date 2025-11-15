/**
 * RevealExperience Component
 * Full-screen reveal sequence orchestrating the big transformation moment
 * Shows: Venn Diagram → Before WWH → Transition → Enhanced WWH
 * Part of the WWH enhancement feature
 */

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { VennDiagramViz } from './VennDiagramViz'
import { WWHBeforeAfter } from './WWHBeforeAfter'
import { Sparkles, X, Download, Share2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { WWHEnhancedData } from '@/services/mirror/wwh-enhancer'

interface RevealExperienceProps {
  data: WWHEnhancedData
  problem: string
  solution: string
  outcome: string
  onComplete: () => void
  onClose: () => void
  className?: string
}

type RevealPhase = 'intro' | 'venn' | 'before' | 'transition' | 'after' | 'final'

export const RevealExperience: React.FC<RevealExperienceProps> = ({
  data,
  problem,
  solution,
  outcome,
  onComplete,
  onClose,
  className,
}) => {
  const [phase, setPhase] = React.useState<RevealPhase>('intro')

  // Auto-advance through phases
  React.useEffect(() => {
    let timer: NodeJS.Timeout

    switch (phase) {
      case 'intro':
        timer = setTimeout(() => setPhase('venn'), 2000)
        break
      case 'venn':
        timer = setTimeout(() => setPhase('before'), 4000)
        break
      case 'before':
        timer = setTimeout(() => setPhase('transition'), 3000)
        break
      case 'transition':
        timer = setTimeout(() => setPhase('after'), 2000)
        break
      case 'after':
        timer = setTimeout(() => setPhase('final'), 3000)
        break
      case 'final':
        // Stay on final, user must click to close
        break
    }

    return () => clearTimeout(timer)
  }, [phase])

  const handleSkip = () => {
    setPhase('final')
  }

  const handleDownload = () => {
    // TODO: Implement PDF/PNG export of enhanced WWH
    console.log('Download WWH Framework')
  }

  const handleShare = () => {
    // TODO: Implement share functionality
    console.log('Share WWH Framework')
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-y-auto',
        className
      )}
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b p-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-lg font-bold">Your Enhanced WWH Framework</h2>
              <p className="text-xs text-muted-foreground">
                Watch as your UVP transforms your strategy
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {phase !== 'final' && (
              <Button variant="ghost" size="sm" onClick={handleSkip}>
                Skip Animation
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Progress Dots */}
      <div className="flex items-center justify-center gap-2 py-6">
        {['intro', 'venn', 'before', 'transition', 'after', 'final'].map((p, idx) => (
          <div
            key={p}
            className={cn(
              'h-2 rounded-full transition-all duration-500',
              p === phase ? 'w-8 bg-blue-600' : 'w-2 bg-gray-300 dark:bg-gray-700'
            )}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="container max-w-6xl mx-auto px-4 py-8 min-h-[calc(100vh-200px)]">
        {/* Phase: Intro */}
        {phase === 'intro' && (
          <div className="flex flex-col items-center justify-center min-h-[500px] text-center animate-in fade-in zoom-in duration-1000">
            <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40">
              <Sparkles className="h-10 w-10 text-blue-600 dark:text-blue-400 animate-pulse" />
            </div>
            <h1 className="text-4xl font-bold mb-4">
              Revealing Your Strategy
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Watch how your UVP insights transform your Why, What, How framework into a powerful strategic foundation
            </p>
          </div>
        )}

        {/* Phase: Venn Diagram */}
        {phase === 'venn' && (
          <div className="animate-in fade-in slide-in-from-bottom duration-1000">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Your Value Sweet Spot</h2>
              <p className="text-muted-foreground">
                Where problem, solution, and outcome intersect
              </p>
            </div>
            <VennDiagramViz
              problem={problem}
              solution={solution}
              outcome={outcome}
              animate={true}
              showLabels={true}
            />
          </div>
        )}

        {/* Phase: Before/Transition/After */}
        {(phase === 'before' || phase === 'transition' || phase === 'after') && (
          <div className="animate-in fade-in duration-500">
            <WWHBeforeAfter
              data={data}
              phase={phase === 'before' ? 'before' : phase === 'transition' ? 'transition' : 'after'}
              onTransitionComplete={() => {
                if (phase === 'after') {
                  // Automatically advance to final after animations complete
                }
              }}
            />
          </div>
        )}

        {/* Phase: Final - Interactive Enhanced Display */}
        {phase === 'final' && (
          <div className="animate-in fade-in zoom-in duration-1000 space-y-8">
            {/* Success Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 border-2 border-green-500 rounded-full px-6 py-3 mb-4">
                <Sparkles className="h-5 w-5 text-green-600" />
                <span className="font-bold text-green-900 dark:text-green-100">
                  Framework Enhanced!
                </span>
              </div>
              <h2 className="text-3xl font-bold mb-2">Your Complete WWH Framework</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                This enhanced framework is now saved and will power all your strategic decisions in the MIRROR process
              </p>
            </div>

            {/* Enhanced WWH Display */}
            <WWHBeforeAfter
              data={data}
              phase="after"
            />

            {/* Insights Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              {/* WHY Insights */}
              <Card>
                <CardContent className="pt-6">
                  <h4 className="font-semibold mb-3 text-yellow-700 dark:text-yellow-400">WHY Improvements:</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {data.insights.whyInsights.map((insight, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-yellow-600 mt-0.5">•</span>
                        {insight}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* HOW Insights */}
              <Card>
                <CardContent className="pt-6">
                  <h4 className="font-semibold mb-3 text-blue-700 dark:text-blue-400">HOW Improvements:</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {data.insights.howInsights.map((insight, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-blue-600 mt-0.5">•</span>
                        {insight}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* WHAT Insights */}
              <Card>
                <CardContent className="pt-6">
                  <h4 className="font-semibold mb-3 text-green-700 dark:text-green-400">WHAT Improvements:</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {data.insights.whatInsights.map((insight, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-green-600 mt-0.5">•</span>
                        {insight}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center gap-4 pt-8">
              <Button
                variant="outline"
                onClick={handleDownload}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download Framework
              </Button>
              <Button
                variant="outline"
                onClick={handleShare}
                className="gap-2"
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
              <Button
                onClick={() => {
                  onComplete()
                  onClose()
                }}
                size="lg"
                className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Sparkles className="h-4 w-4" />
                Continue to Reimagine Section
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
