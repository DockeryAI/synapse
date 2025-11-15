/**
 * UVPOfferingsStep Component
 * WHAT question - Outcome-focused core offerings
 * Part of WWH (Why, What, How) Framework enhancement
 */

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Package, ChevronRight, Plus, X, Check, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UVPOfferingsStepProps {
  values: string[]
  onChange: (values: string[]) => void
  onComplete?: () => void
  className?: string
  brandData?: any
}

export const UVPOfferingsStep: React.FC<UVPOfferingsStepProps> = ({
  values,
  onChange,
  onComplete,
  className,
  brandData,
}) => {
  const [selectedValues, setSelectedValues] = React.useState<string[]>(values)
  const [customValue, setCustomValue] = React.useState('')

  React.useEffect(() => {
    setSelectedValues(values)
  }, [values])

  const handleAddCustom = () => {
    if (customValue.trim() && !selectedValues.includes(customValue.trim())) {
      const newValues = [...selectedValues, customValue.trim()]
      setSelectedValues(newValues)
      onChange(newValues)
      setCustomValue('')
    }
  }

  const handleRemove = (value: string) => {
    const newValues = selectedValues.filter((v) => v !== value)
    setSelectedValues(newValues)
    onChange(newValues)
  }

  const isComplete = selectedValues.length >= 2

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 mb-4">
          <Package className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-2xl font-bold">WHAT: Your Core Offerings</h3>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          What do you offer? Focus on outcomes and results, not just features. What do customers actually get?
        </p>
      </div>

      {/* Selected Items */}
      {selectedValues.length > 0 && (
        <Card className="border-2 border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
              Your Core Offerings ({selectedValues.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {selectedValues.map((value, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{value}</p>
                  </div>
                  <button
                    onClick={() => handleRemove(value)}
                    className="text-muted-foreground hover:text-green-600 dark:hover:text-green-400"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Input Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Your Offerings
          </CardTitle>
          <CardDescription>
            Describe each offering in terms of the outcome or result customers receive (e.g., "Marketing campaigns
            that generate 3x ROI" instead of "Marketing campaign tool")
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="e.g., Automated email campaigns that nurture leads into customers"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddCustom()
                }
              }}
              className="flex-1"
            />
            <Button onClick={handleAddCustom} disabled={!customValue.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            Press Enter or click Add to save. Aim for 2-5 key offerings.
          </div>
        </CardContent>
      </Card>

      {/* Example Offerings */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Examples of outcome-focused offerings:
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <Badge variant="secondary" className="bg-green-600 text-white mt-0.5">✓</Badge>
              <span>
                <strong>Good:</strong> "AI-powered content that ranks on page 1 of Google within 90 days"
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Badge variant="secondary" className="bg-red-600 text-white mt-0.5">✗</Badge>
              <span>
                <strong>Avoid:</strong> "SEO content writing service"
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Badge variant="secondary" className="bg-green-600 text-white mt-0.5">✓</Badge>
              <span>
                <strong>Good:</strong> "Real-time analytics that predict customer churn before it happens"
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Badge variant="secondary" className="bg-red-600 text-white mt-0.5">✗</Badge>
              <span>
                <strong>Avoid:</strong> "Analytics dashboard"
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Guidance Tips */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Package className="h-4 w-4" />
            Tips for powerful offerings:
          </h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
              <span>Focus on the result or transformation, not the tool or feature</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
              <span>Include specific metrics or timeframes when possible</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
              <span>Think about the end benefit customers care about</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
              <span>These should directly deliver on your WHY and be enabled by your HOW</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Complete Button */}
      {onComplete && (
        <div className="flex justify-center pt-4">
          <Button
            onClick={onComplete}
            disabled={!isComplete}
            size="lg"
            className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            {isComplete ? (
              <>
                <Sparkles className="h-4 w-4" />
                Complete & See Your Enhanced WWH Framework
                <ChevronRight className="h-4 w-4" />
              </>
            ) : (
              'Add at least 2 offerings to continue'
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
