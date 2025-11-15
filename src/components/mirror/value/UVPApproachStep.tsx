/**
 * UVPApproachStep Component
 * HOW question - Multi-select differentiators and unique approach
 * Part of WWH (Why, What, How) Framework enhancement
 */

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Lightbulb, ChevronRight, Plus, X, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UVPApproachStepProps {
  values: string[]
  onChange: (values: string[]) => void
  onNext?: () => void
  className?: string
  brandData?: any
}

// Pre-defined differentiator options
const DIFFERENTIATOR_OPTIONS = [
  'AI-powered automation',
  'Data-driven insights',
  'Industry expertise',
  'White-glove support',
  'Transparent pricing',
  'No contracts required',
  'Enterprise-grade security',
  'Rapid implementation',
  'Custom solutions',
  'Proven track record',
  'Cutting-edge technology',
  'Human-centered design',
  'Seamless integrations',
  'Real-time analytics',
  'Scalable platform',
  'Cost-effective pricing',
]

export const UVPApproachStep: React.FC<UVPApproachStepProps> = ({
  values,
  onChange,
  onNext,
  className,
  brandData,
}) => {
  const [selectedValues, setSelectedValues] = React.useState<string[]>(values)
  const [customValue, setCustomValue] = React.useState('')

  React.useEffect(() => {
    setSelectedValues(values)
  }, [values])

  const handleToggle = (value: string) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value]

    setSelectedValues(newValues)
    onChange(newValues)
  }

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
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 mb-4">
          <Lightbulb className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-2xl font-bold">HOW: Your Unique Approach</h3>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          How do you deliver on your purpose? What makes your approach different and better than alternatives?
        </p>
      </div>

      {/* Selected Items */}
      {selectedValues.length > 0 && (
        <Card className="border-2 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              Your Unique Differentiators ({selectedValues.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {selectedValues.map((value, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-100 text-sm py-1.5 px-3 gap-2"
                >
                  {value}
                  <button
                    onClick={() => handleRemove(value)}
                    className="hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pre-defined Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Choose Your Differentiators</CardTitle>
          <CardDescription>
            Select at least 2 that best describe your unique approach (you can select multiple)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {DIFFERENTIATOR_OPTIONS.map((option) => {
              const isSelected = selectedValues.includes(option)
              return (
                <Button
                  key={option}
                  variant={isSelected ? 'default' : 'outline'}
                  className={cn(
                    'h-auto py-3 justify-start text-left',
                    isSelected &&
                      'bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700'
                  )}
                  onClick={() => handleToggle(option)}
                >
                  {isSelected && <Check className="h-4 w-4 mr-2 flex-shrink-0" />}
                  <span className="text-sm">{option}</span>
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Custom Input */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Your Own Differentiator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="e.g., 24/7 customer support"
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
        </CardContent>
      </Card>

      {/* Guidance Tips */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Tips for powerful differentiators:
          </h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
              <span>Choose 2-5 key differentiators - quality over quantity</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
              <span>Focus on what you do uniquely well, not generic features</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
              <span>Think about your processes, methodology, and approach</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
              <span>These should directly support your WHY (purpose)</span>
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
            {isComplete ? 'Continue to WHAT' : 'Select at least 2 differentiators to continue'}
            {isComplete && <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
      )}
    </div>
  )
}
