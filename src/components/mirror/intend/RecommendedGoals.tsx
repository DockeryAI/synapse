import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { IntentObjective, ObjectivesGenerator } from '@/services/mirror/objectives-generator'
import { Sparkles, TrendingUp, CheckCircle, ArrowRight } from 'lucide-react'

interface RecommendedGoalsProps {
  situationData: { brandHealth: number; industry: string; currentMetrics: Record<string, number> }
  onAccept: (objective: IntentObjective) => void
  className?: string
}

export const RecommendedGoals: React.FC<RecommendedGoalsProps> = ({
  situationData,
  onAccept,
  className,
}) => {
  const recommended = ObjectivesGenerator.generateRecommendedObjectives(situationData)

  const effortColors = {
    low: 'success' as const,
    medium: 'warning' as const,
    high: 'destructive' as const,
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle>Recommended Goals</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          AI-generated goals based on your brand analysis
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommended.map((goal, i) => (
          <Card key={i} className="p-4 border-l-4 border-l-primary">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold">{goal.title}</h4>
                    <Badge variant="secondary">{ObjectivesGenerator.formatCategory(goal.category)}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{goal.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center py-2 border-t border-b">
                <div>
                  <div className="text-2xl font-bold text-primary">{goal.current_value}</div>
                  <div className="text-xs text-muted-foreground">Current</div>
                </div>
                <div>
                  <ArrowRight className="h-5 w-5 mx-auto text-muted-foreground" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{goal.target_value}</div>
                  <div className="text-xs text-muted-foreground">Target</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">Why this matters:</div>
                <p className="text-sm">{goal.reasoning}</p>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">Expected impact:</div>
                <p className="text-sm">{goal.expected_impact}</p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <Badge variant={effortColors[goal.effort_required || 'medium']}>
                    {goal.effort_required} effort
                  </Badge>
                  <Badge variant="outline">{ObjectivesGenerator.formatTimeline(goal.timeline)}</Badge>
                </div>
                <Button size="sm" onClick={() => onAccept(goal)}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Accept Goal
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </CardContent>
    </Card>
  )
}
