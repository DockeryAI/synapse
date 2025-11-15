import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { IntentObjective, ObjectivesGenerator } from '@/services/mirror/objectives-generator'
import { CheckCircle2, AlertCircle, Plus } from 'lucide-react'
import { SynapseLiveScoring } from '../reimagine/SynapseLiveScoring'

interface GoalBuilderProps {
  onSave: (objective: IntentObjective) => void
  brandData?: any
  className?: string
}

export const GoalBuilder: React.FC<GoalBuilderProps> = ({ onSave, brandData, className }) => {
  const [objective, setObjective] = React.useState<Partial<IntentObjective>>({
    category: 'awareness',
    timeline: '90_days',
    status: 'active',
  })
  const [validation, setValidation] = React.useState<{ valid: boolean; errors: string[]; suggestions: string[] }>({
    valid: false,
    errors: [],
    suggestions: [],
  })

  React.useEffect(() => {
    const result = ObjectivesGenerator.validateSMARTGoal(objective)
    setValidation(result)
  }, [objective])

  const handleSave = () => {
    if (validation.valid) {
      onSave(objective as IntentObjective)
      setObjective({ category: 'awareness', timeline: '90_days', status: 'active' })
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Create New Goal</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={objective.category} onValueChange={(v) => setObjective({ ...objective, category: v as any })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="awareness">Brand Awareness</SelectItem>
                <SelectItem value="leads">Lead Generation</SelectItem>
                <SelectItem value="retention">Customer Retention</SelectItem>
                <SelectItem value="revenue">Revenue Growth</SelectItem>
                <SelectItem value="engagement">Audience Engagement</SelectItem>
                <SelectItem value="custom">Custom Goal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Timeline</Label>
            <Select value={objective.timeline} onValueChange={(v) => setObjective({ ...objective, timeline: v as any })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30_days">30 Days</SelectItem>
                <SelectItem value="60_days">60 Days</SelectItem>
                <SelectItem value="90_days">90 Days</SelectItem>
                <SelectItem value="6_months">6 Months</SelectItem>
                <SelectItem value="1_year">1 Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <SynapseLiveScoring
            value={objective.title || ''}
            onChange={(value) => setObjective({ ...objective, title: value })}
            brandData={brandData}
            placeholder="e.g., Increase social media followers by 50%"
            label="Goal Title"
            minScore={7}
          />
        </div>

        <div className="space-y-2">
          <SynapseLiveScoring
            value={objective.description || ''}
            onChange={(value) => setObjective({ ...objective, description: value })}
            brandData={brandData}
            placeholder="Describe what you want to achieve..."
            label="Description"
            minScore={7}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Current Value</Label>
            <Input type="number" placeholder="0" value={objective.current_value || ''} onChange={(e) => setObjective({ ...objective, current_value: parseFloat(e.target.value) })} />
          </div>

          <div className="space-y-2">
            <Label>Target Value</Label>
            <Input type="number" placeholder="100" value={objective.target_value || ''} onChange={(e) => setObjective({ ...objective, target_value: parseFloat(e.target.value) })} />
          </div>

          <div className="space-y-2">
            <Label>Unit</Label>
            <Input placeholder="followers, %, $" value={objective.unit || ''} onChange={(e) => setObjective({ ...objective, unit: e.target.value })} />
          </div>
        </div>

        {/* Validation Messages */}
        {validation.errors.length > 0 && (
          <div className="space-y-1">
            {validation.errors.map((error, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            ))}
          </div>
        )}

        {validation.suggestions.length > 0 && (
          <div className="space-y-1">
            {validation.suggestions.map((suggestion, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4" />
                <span>{suggestion}</span>
              </div>
            ))}
          </div>
        )}

        <Button onClick={handleSave} disabled={!validation.valid} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Create Goal
        </Button>
      </CardContent>
    </Card>
  )
}
