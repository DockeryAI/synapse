/**
 * UVPPurposeStep Component
 * WHY question - Captures brand purpose and reason for existing
 * Part of WWH (Why, What, How) Framework enhancement
 */

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Heart, Sparkles, ChevronRight, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UVPPurposeStepProps {
  value: string
  onChange: (value: string) => void
  onNext?: () => void
  className?: string
  brandData?: any
}

// AI-powered purpose suggestions based on industry/problem/solution
const PURPOSE_SUGGESTIONS = [
  'To empower businesses to reach their full potential',
  'To make professional marketing accessible to everyone',
  'To transform how companies connect with their customers',
  'To democratize access to powerful tools and insights',
  'To help businesses grow without breaking the bank',
  'To simplify complex processes for busy professionals',
  'To give small businesses the power of enterprise tools',
  'To enable data-driven decisions for every organization',
]

export const UVPPurposeStep: React.FC<UVPPurposeStepProps> = ({
  value,
  onChange,
  onNext,
  className,
  brandData,
}) => {
  const [localValue, setLocalValue] = React.useState(value)

  React.useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalValue(e.target.value)
    onChange(e.target.value)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setLocalValue(suggestion)
    onChange(suggestion)
  }

  const isComplete = localValue.length >= 20

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-yellow-100 to-amber-100 dark:from-yellow-900/40 dark:to-amber-900/40 mb-4">
          <Heart className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
        </div>
        <h3 className="text-2xl font-bold">WHY: Your Purpose</h3>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Start with why. What's your core purpose, belief, or cause? Why does your brand exist beyond making money?
        </p>
      </div>

      {/* Main Input Card */}
      <Card className="border-2 border-yellow-200 dark:border-yellow-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            Why does your brand exist?
          </CardTitle>
          <CardDescription>
            Think about your mission, vision, and the change you want to create in the world.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="e.g., We believe that every business deserves access to professional-grade marketing tools, regardless of their budget. We exist to level the playing field and empower entrepreneurs to compete with larger companies."
            value={localValue}
            onChange={handleChange}
            className="min-h-[150px] resize-none text-base"
            maxLength={500}
          />

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{localValue.length} / 500 characters</span>
            {isComplete && (
              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                Looks great!
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI Suggestions */}
      {!isComplete && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Need inspiration? Try these examples:
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {PURPOSE_SUGGESTIONS.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="h-auto py-3 px-4 text-left justify-start hover:border-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-950/20"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <Lightbulb className="h-4 w-4 mr-2 text-yellow-600 flex-shrink-0" />
                  <span className="text-sm">{suggestion}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Guidance Tips */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Tips for a powerful WHY:
          </h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-yellow-600 dark:text-yellow-400 mt-0.5">•</span>
              <span>Focus on the change you want to create, not what you sell</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-600 dark:text-yellow-400 mt-0.5">•</span>
              <span>Make it emotional and aspirational - why should people care?</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-600 dark:text-yellow-400 mt-0.5">•</span>
              <span>Keep it authentic - this should reflect your true values</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-600 dark:text-yellow-400 mt-0.5">•</span>
              <span>Aim for 2-3 sentences that capture your core belief</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Next Button */}
      {onNext && (
        <div className="flex justify-center pt-4">
          <Button
            onClick={onNext}
            disabled={!isComplete}
            size="lg"
            className="gap-2"
          >
            {isComplete ? 'Continue to HOW' : 'Write at least 20 characters to continue'}
            {isComplete && <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
      )}
    </div>
  )
}
