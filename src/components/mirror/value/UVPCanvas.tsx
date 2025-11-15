/**
 * UVPCanvas Component
 * Mad Libs-style UVP builder with dropdowns
 * Quick, guided approach to creating value propositions
 */

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sparkles, Check, Edit3 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UVPCanvasProps {
  onSave?: (uvp: {
    targetAudience: string
    problem: string
    solution: string
    benefit: string
    differentiator: string
  }) => void
  className?: string
}

// Pre-defined options for dropdowns
const TARGET_AUDIENCES = [
  { value: 'small-businesses', label: 'Small businesses' },
  { value: 'startups', label: 'Startups' },
  { value: 'enterprises', label: 'Enterprises' },
  { value: 'entrepreneurs', label: 'Entrepreneurs' },
  { value: 'marketers', label: 'Marketing teams' },
  { value: 'sales-teams', label: 'Sales teams' },
  { value: 'agencies', label: 'Agencies' },
  { value: 'ecommerce', label: 'E-commerce businesses' },
  { value: 'saas', label: 'SaaS companies' },
  { value: 'custom', label: 'Custom...' },
]

const PROBLEMS = [
  { value: 'time-consuming', label: 'Struggle with time-consuming processes' },
  { value: 'high-costs', label: 'Face high costs' },
  { value: 'lack-expertise', label: 'Lack expertise or resources' },
  { value: 'inconsistent-results', label: 'Get inconsistent results' },
  { value: 'scattered-tools', label: 'Use scattered, disconnected tools' },
  { value: 'manual-work', label: 'Rely on manual, repetitive work' },
  { value: 'poor-quality', label: 'Receive poor quality output' },
  { value: 'scaling-issues', label: 'Can\'t scale effectively' },
  { value: 'custom', label: 'Custom...' },
]

const SOLUTIONS = [
  { value: 'ai-powered', label: 'AI-powered automation' },
  { value: 'all-in-one', label: 'All-in-one platform' },
  { value: 'expert-guidance', label: 'Expert guidance and support' },
  { value: 'data-driven', label: 'Data-driven insights' },
  { value: 'streamlined', label: 'Streamlined workflow' },
  { value: 'customizable', label: 'Fully customizable solution' },
  { value: 'integrated', label: 'Seamlessly integrated system' },
  { value: 'intelligent', label: 'Intelligent recommendations' },
  { value: 'custom', label: 'Custom...' },
]

const BENEFITS = [
  { value: 'save-time', label: 'Save 10+ hours per week' },
  { value: 'reduce-costs', label: 'Reduce costs by 50%' },
  { value: 'increase-revenue', label: 'Increase revenue by 30%' },
  { value: 'boost-efficiency', label: 'Boost team efficiency by 3x' },
  { value: 'improve-quality', label: 'Improve output quality by 80%' },
  { value: 'scale-faster', label: 'Scale 5x faster' },
  { value: 'reduce-errors', label: 'Reduce errors by 90%' },
  { value: 'grow-audience', label: 'Grow your audience by 2x' },
  { value: 'custom', label: 'Custom...' },
]

const DIFFERENTIATORS = [
  { value: 'no-code', label: 'No coding or technical skills required' },
  { value: 'minutes-setup', label: 'Set up in minutes, not weeks' },
  { value: 'affordable', label: 'At a fraction of the cost' },
  { value: 'enterprise-grade', label: 'With enterprise-grade security' },
  { value: 'dedicated-support', label: 'With dedicated expert support' },
  { value: 'proven-results', label: 'With proven, measurable results' },
  { value: 'continuous-improvement', label: 'That gets smarter over time' },
  { value: 'industry-specific', label: 'Built specifically for your industry' },
  { value: 'custom', label: 'Custom...' },
]

export const UVPCanvas: React.FC<UVPCanvasProps> = ({ onSave, className }) => {
  const [targetAudience, setTargetAudience] = React.useState('')
  const [customAudience, setCustomAudience] = React.useState('')
  const [problem, setProblem] = React.useState('')
  const [customProblem, setCustomProblem] = React.useState('')
  const [solution, setSolution] = React.useState('')
  const [customSolution, setCustomSolution] = React.useState('')
  const [benefit, setBenefit] = React.useState('')
  const [customBenefit, setCustomBenefit] = React.useState('')
  const [differentiator, setDifferentiator] = React.useState('')
  const [customDifferentiator, setCustomDifferentiator] = React.useState('')

  const isComplete =
    (targetAudience && (targetAudience !== 'custom' || customAudience)) &&
    (problem && (problem !== 'custom' || customProblem)) &&
    (solution && (solution !== 'custom' || customSolution)) &&
    (benefit && (benefit !== 'custom' || customBenefit)) &&
    (differentiator && (differentiator !== 'custom' || customDifferentiator))

  const getDisplayValue = (value: string, custom: string, options: typeof TARGET_AUDIENCES) => {
    if (value === 'custom') return custom
    return options.find((opt) => opt.value === value)?.label || ''
  }

  const constructedUVP = React.useMemo(() => {
    if (!isComplete) return ''

    const audience = getDisplayValue(targetAudience, customAudience, TARGET_AUDIENCES)
    const prob = getDisplayValue(problem, customProblem, PROBLEMS)
    const sol = getDisplayValue(solution, customSolution, SOLUTIONS)
    const ben = getDisplayValue(benefit, customBenefit, BENEFITS)
    const diff = getDisplayValue(differentiator, customDifferentiator, DIFFERENTIATORS)

    return `For ${audience} who ${prob}, our ${sol} helps you ${ben}, ${diff}.`
  }, [
    targetAudience,
    customAudience,
    problem,
    customProblem,
    solution,
    customSolution,
    benefit,
    customBenefit,
    differentiator,
    customDifferentiator,
    isComplete,
  ])

  const handleSave = () => {
    if (!isComplete) return

    onSave?.({
      targetAudience: getDisplayValue(targetAudience, customAudience, TARGET_AUDIENCES),
      problem: getDisplayValue(problem, customProblem, PROBLEMS),
      solution: getDisplayValue(solution, customSolution, SOLUTIONS),
      benefit: getDisplayValue(benefit, customBenefit, BENEFITS),
      differentiator: getDisplayValue(differentiator, customDifferentiator, DIFFERENTIATORS),
    })
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold">UVP Canvas</h3>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
          Fill in the blanks to quickly construct your value proposition. Select from curated options
          or write your own.
        </p>
      </div>

      {/* Canvas Builder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            Build Your UVP
          </CardTitle>
          <CardDescription>
            Complete each field to see your value proposition come together
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Target Audience */}
          <div className="space-y-2">
            <Label htmlFor="audience">For...</Label>
            <div className="flex gap-2">
              <Select value={targetAudience} onValueChange={setTargetAudience}>
                <SelectTrigger id="audience" className="flex-1">
                  <SelectValue placeholder="Select target audience" />
                </SelectTrigger>
                <SelectContent>
                  {TARGET_AUDIENCES.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {targetAudience === 'custom' && (
                <Input
                  placeholder="Enter custom audience"
                  value={customAudience}
                  onChange={(e) => setCustomAudience(e.target.value)}
                  className="flex-1"
                />
              )}
            </div>
          </div>

          {/* Problem */}
          <div className="space-y-2">
            <Label htmlFor="problem">Who...</Label>
            <div className="flex gap-2">
              <Select value={problem} onValueChange={setProblem}>
                <SelectTrigger id="problem" className="flex-1">
                  <SelectValue placeholder="Select problem" />
                </SelectTrigger>
                <SelectContent>
                  {PROBLEMS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {problem === 'custom' && (
                <Input
                  placeholder="Enter custom problem"
                  value={customProblem}
                  onChange={(e) => setCustomProblem(e.target.value)}
                  className="flex-1"
                />
              )}
            </div>
          </div>

          {/* Solution */}
          <div className="space-y-2">
            <Label htmlFor="solution">Our...</Label>
            <div className="flex gap-2">
              <Select value={solution} onValueChange={setSolution}>
                <SelectTrigger id="solution" className="flex-1">
                  <SelectValue placeholder="Select solution type" />
                </SelectTrigger>
                <SelectContent>
                  {SOLUTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {solution === 'custom' && (
                <Input
                  placeholder="Enter custom solution"
                  value={customSolution}
                  onChange={(e) => setCustomSolution(e.target.value)}
                  className="flex-1"
                />
              )}
            </div>
          </div>

          {/* Benefit */}
          <div className="space-y-2">
            <Label htmlFor="benefit">Helps you...</Label>
            <div className="flex gap-2">
              <Select value={benefit} onValueChange={setBenefit}>
                <SelectTrigger id="benefit" className="flex-1">
                  <SelectValue placeholder="Select benefit" />
                </SelectTrigger>
                <SelectContent>
                  {BENEFITS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {benefit === 'custom' && (
                <Input
                  placeholder="Enter custom benefit"
                  value={customBenefit}
                  onChange={(e) => setCustomBenefit(e.target.value)}
                  className="flex-1"
                />
              )}
            </div>
          </div>

          {/* Differentiator */}
          <div className="space-y-2">
            <Label htmlFor="differentiator">With/At...</Label>
            <div className="flex gap-2">
              <Select value={differentiator} onValueChange={setDifferentiator}>
                <SelectTrigger id="differentiator" className="flex-1">
                  <SelectValue placeholder="Select differentiator" />
                </SelectTrigger>
                <SelectContent>
                  {DIFFERENTIATORS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {differentiator === 'custom' && (
                <Input
                  placeholder="Enter custom differentiator"
                  value={customDifferentiator}
                  onChange={(e) => setCustomDifferentiator(e.target.value)}
                  className="flex-1"
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {constructedUVP && (
        <Card className="border-2 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Your UVP Preview</CardTitle>
              {isComplete && (
                <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                  <Check className="h-3 w-3 mr-1" />
                  Complete
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-lg leading-relaxed">{constructedUVP}</p>
          </CardContent>
        </Card>
      )}

      {/* Progress Indicator */}
      <div className="flex items-center justify-center gap-2">
        <div
          className={cn(
            'h-2 w-2 rounded-full transition-colors',
            targetAudience && (targetAudience !== 'custom' || customAudience) ? 'bg-green-500' : 'bg-gray-300'
          )}
        />
        <div
          className={cn(
            'h-2 w-2 rounded-full transition-colors',
            problem && (problem !== 'custom' || customProblem) ? 'bg-green-500' : 'bg-gray-300'
          )}
        />
        <div
          className={cn(
            'h-2 w-2 rounded-full transition-colors',
            solution && (solution !== 'custom' || customSolution) ? 'bg-green-500' : 'bg-gray-300'
          )}
        />
        <div
          className={cn(
            'h-2 w-2 rounded-full transition-colors',
            benefit && (benefit !== 'custom' || customBenefit) ? 'bg-green-500' : 'bg-gray-300'
          )}
        />
        <div
          className={cn(
            'h-2 w-2 rounded-full transition-colors',
            differentiator && (differentiator !== 'custom' || customDifferentiator)
              ? 'bg-green-500'
              : 'bg-gray-300'
          )}
        />
      </div>

      {/* Save Button */}
      <div className="flex justify-center pt-4">
        <Button onClick={handleSave} disabled={!isComplete} size="lg" className="gap-2">
          <Sparkles className="h-4 w-4" />
          {isComplete ? 'Save This UVP' : 'Complete All Fields to Continue'}
        </Button>
      </div>

      {/* Completion Status */}
      {isComplete && (
        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Check className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
            <div>
              <p className="font-medium text-green-900 dark:text-green-100">
                Great work! Your UVP is ready.
              </p>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                Click the button above to save this value proposition, or continue editing to refine it.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
