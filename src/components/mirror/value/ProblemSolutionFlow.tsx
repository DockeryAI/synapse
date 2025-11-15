/**
 * ProblemSolutionFlow Component
 * Visual P→S→O flow with editable cards
 * Core UVP builder visualization showing problem, solution, and outcome relationship
 */

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, AlertTriangle, Lightbulb, Target, Sparkles, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RealTimeScoring } from './RealTimeScoring'

interface ProblemSolutionFlowProps {
  problem?: string
  solution?: string
  outcome?: string
  onProblemChange?: (value: string) => void
  onSolutionChange?: (value: string) => void
  onOutcomeChange?: (value: string) => void
  onSave?: () => void
  readOnly?: boolean
  showSaveButton?: boolean
  className?: string
}

export const ProblemSolutionFlow: React.FC<ProblemSolutionFlowProps> = ({
  problem = '',
  solution = '',
  outcome = '',
  onProblemChange,
  onSolutionChange,
  onOutcomeChange,
  onSave,
  readOnly = false,
  showSaveButton = true,
  className,
}) => {
  const [localProblem, setLocalProblem] = React.useState(problem)
  const [localSolution, setLocalSolution] = React.useState(solution)
  const [localOutcome, setLocalOutcome] = React.useState(outcome)

  // Update local state when props change
  React.useEffect(() => {
    setLocalProblem(problem)
  }, [problem])

  React.useEffect(() => {
    setLocalSolution(solution)
  }, [solution])

  React.useEffect(() => {
    setLocalOutcome(outcome)
  }, [outcome])

  const handleProblemChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalProblem(e.target.value)
    onProblemChange?.(e.target.value)
  }

  const handleSolutionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalSolution(e.target.value)
    onSolutionChange?.(e.target.value)
  }

  const handleOutcomeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalOutcome(e.target.value)
    onOutcomeChange?.(e.target.value)
  }

  const isComplete = localProblem.length > 10 && localSolution.length > 10 && localOutcome.length > 10

  // Combined text for scoring
  const combinedText = React.useMemo(() => {
    return `${localSolution} ${localOutcome}`.trim()
  }, [localSolution, localOutcome])

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold">Problem → Solution → Outcome</h3>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
          Define the problem your customers face, your unique solution, and the outcome they'll achieve.
          This forms the foundation of your value proposition.
        </p>
      </div>

      {/* Flow Visualization */}
      <div className="relative">
        {/* Desktop: Horizontal Layout */}
        <div className="hidden md:flex items-start gap-4">
          {/* Problem Card */}
          <Card className={cn(
            'flex-1 transition-all',
            localProblem.length > 10 && 'border-red-200 dark:border-red-800'
          )}>
            <CardHeader className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base">Problem</CardTitle>
                  <CardDescription className="text-xs">What pain do they feel?</CardDescription>
                </div>
                {localProblem.length > 10 && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                    <Check className="h-3 w-3 mr-1" />
                    Done
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <Label htmlFor="problem" className="sr-only">Problem Statement</Label>
              <Textarea
                id="problem"
                placeholder="e.g., Small businesses struggle to create professional marketing content quickly and affordably..."
                value={localProblem}
                onChange={handleProblemChange}
                readOnly={readOnly}
                className="min-h-[120px] resize-none"
                disabled={readOnly}
              />
              <p className="text-xs text-muted-foreground mt-2">
                {localProblem.length} characters
              </p>
            </CardContent>
          </Card>

          {/* Arrow 1 */}
          <div className="flex items-center justify-center pt-20">
            <ArrowRight className="h-8 w-8 text-muted-foreground" />
          </div>

          {/* Solution Card */}
          <Card className={cn(
            'flex-1 transition-all',
            localSolution.length > 10 && 'border-blue-200 dark:border-blue-800'
          )}>
            <CardHeader className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-2">
                  <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base">Solution</CardTitle>
                  <CardDescription className="text-xs">How do you solve it?</CardDescription>
                </div>
                {localSolution.length > 10 && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                    <Check className="h-3 w-3 mr-1" />
                    Done
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <Label htmlFor="solution" className="sr-only">Solution Statement</Label>
              <Textarea
                id="solution"
                placeholder="e.g., Our AI-powered platform generates brand-aligned marketing content in minutes, with templates tailored to your industry..."
                value={localSolution}
                onChange={handleSolutionChange}
                readOnly={readOnly}
                className="min-h-[120px] resize-none"
                disabled={readOnly}
              />
              <p className="text-xs text-muted-foreground mt-2">
                {localSolution.length} characters
              </p>
            </CardContent>
          </Card>

          {/* Arrow 2 */}
          <div className="flex items-center justify-center pt-20">
            <ArrowRight className="h-8 w-8 text-muted-foreground" />
          </div>

          {/* Outcome Card */}
          <Card className={cn(
            'flex-1 transition-all',
            localOutcome.length > 10 && 'border-green-200 dark:border-green-800'
          )}>
            <CardHeader className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-2">
                  <Target className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base">Outcome</CardTitle>
                  <CardDescription className="text-xs">What do they achieve?</CardDescription>
                </div>
                {localOutcome.length > 10 && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                    <Check className="h-3 w-3 mr-1" />
                    Done
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <Label htmlFor="outcome" className="sr-only">Outcome Statement</Label>
              <Textarea
                id="outcome"
                placeholder="e.g., Save 10+ hours per week on content creation, increase engagement by 50%, and grow your brand consistently..."
                value={localOutcome}
                onChange={handleOutcomeChange}
                readOnly={readOnly}
                className="min-h-[120px] resize-none"
                disabled={readOnly}
              />
              <p className="text-xs text-muted-foreground mt-2">
                {localOutcome.length} characters
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Mobile: Vertical Layout */}
        <div className="md:hidden space-y-4">
          {/* Problem Card */}
          <Card className={cn(
            'transition-all',
            localProblem.length > 10 && 'border-red-200 dark:border-red-800'
          )}>
            <CardHeader className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base">Problem</CardTitle>
                  <CardDescription className="text-xs">What pain do they feel?</CardDescription>
                </div>
                {localProblem.length > 10 && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                    <Check className="h-3 w-3" />
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <Textarea
                placeholder="e.g., Small businesses struggle to create professional marketing content quickly and affordably..."
                value={localProblem}
                onChange={handleProblemChange}
                readOnly={readOnly}
                className="min-h-[120px] resize-none"
                disabled={readOnly}
              />
              <p className="text-xs text-muted-foreground mt-2">
                {localProblem.length} characters
              </p>
            </CardContent>
          </Card>

          {/* Down Arrow */}
          <div className="flex justify-center">
            <div className="rotate-90">
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
            </div>
          </div>

          {/* Solution Card */}
          <Card className={cn(
            'transition-all',
            localSolution.length > 10 && 'border-blue-200 dark:border-blue-800'
          )}>
            <CardHeader className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-2">
                  <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base">Solution</CardTitle>
                  <CardDescription className="text-xs">How do you solve it?</CardDescription>
                </div>
                {localSolution.length > 10 && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                    <Check className="h-3 w-3" />
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <Textarea
                placeholder="e.g., Our AI-powered platform generates brand-aligned marketing content in minutes, with templates tailored to your industry..."
                value={localSolution}
                onChange={handleSolutionChange}
                readOnly={readOnly}
                className="min-h-[120px] resize-none"
                disabled={readOnly}
              />
              <p className="text-xs text-muted-foreground mt-2">
                {localSolution.length} characters
              </p>
            </CardContent>
          </Card>

          {/* Down Arrow */}
          <div className="flex justify-center">
            <div className="rotate-90">
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
            </div>
          </div>

          {/* Outcome Card */}
          <Card className={cn(
            'transition-all',
            localOutcome.length > 10 && 'border-green-200 dark:border-green-800'
          )}>
            <CardHeader className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-2">
                  <Target className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base">Outcome</CardTitle>
                  <CardDescription className="text-xs">What do they achieve?</CardDescription>
                </div>
                {localOutcome.length > 10 && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                    <Check className="h-3 w-3" />
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <Textarea
                placeholder="e.g., Save 10+ hours per week on content creation, increase engagement by 50%, and grow your brand consistently..."
                value={localOutcome}
                onChange={handleOutcomeChange}
                readOnly={readOnly}
                className="min-h-[120px] resize-none"
                disabled={readOnly}
              />
              <p className="text-xs text-muted-foreground mt-2">
                {localOutcome.length} characters
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-center gap-2 pt-4">
        <div className={cn(
          'h-2 w-2 rounded-full transition-colors',
          localProblem.length > 10 ? 'bg-green-500' : 'bg-gray-300'
        )} />
        <div className={cn(
          'h-2 w-2 rounded-full transition-colors',
          localSolution.length > 10 ? 'bg-green-500' : 'bg-gray-300'
        )} />
        <div className={cn(
          'h-2 w-2 rounded-full transition-colors',
          localOutcome.length > 10 ? 'bg-green-500' : 'bg-gray-300'
        )} />
      </div>

      {/* Save Button */}
      {!readOnly && showSaveButton && onSave && (
        <div className="flex justify-center pt-4">
          <Button
            onClick={onSave}
            disabled={!isComplete}
            size="lg"
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {isComplete ? 'Generate UVP from This Flow' : 'Complete All Fields to Continue'}
          </Button>
        </div>
      )}

      {/* Completion Status */}
      {isComplete && (
        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Check className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
            <div>
              <p className="font-medium text-green-900 dark:text-green-100">
                Great work! Your P→S→O flow is complete.
              </p>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                Click the button above to generate your UVP, or continue editing to refine your message.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Real-Time Scoring */}
      {combinedText.length > 10 && (
        <RealTimeScoring text={combinedText} />
      )}
    </div>
  )
}
