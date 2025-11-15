import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react'

interface Competitor {
  name: string
  score: number
  strengths: string[]
}

interface CompetitiveLandscapeCardProps {
  competitors: Competitor[]
  userScore: number
  differentiators: string[]
  gaps: string[]
  className?: string
}

export const CompetitiveLandscapeCard: React.FC<CompetitiveLandscapeCardProps> = ({
  competitors,
  userScore,
  differentiators,
  gaps,
  className,
}) => {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Competitive Landscape</CardTitle>
          <Badge variant="secondary">{competitors.length} competitors tracked</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Competitive Scores */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10">
            <span className="font-medium">Your Brand</span>
            <Badge variant="default" className="text-lg px-3">{userScore}</Badge>
          </div>
          {competitors.map((comp, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm">{comp.name}</span>
              <Badge variant="outline">{comp.score}</Badge>
            </div>
          ))}
        </div>

        {/* Key Differentiators */}
        {differentiators.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Lightbulb className="h-4 w-4 text-green-600" />
              <span>Your Key Differentiators</span>
            </div>
            <div className="space-y-1">
              {differentiators.map((diff, i) => (
                <div key={i} className="text-sm text-muted-foreground pl-6">
                  • {diff}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gaps */}
        {gaps.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span>Gaps Competitors Are Exploiting</span>
            </div>
            <div className="space-y-1">
              {gaps.map((gap, i) => (
                <div key={i} className="text-sm text-muted-foreground pl-6">
                  • {gap}
                </div>
              ))}
            </div>
          </div>
        )}

        <Button variant="outline" className="w-full">
          <Users className="h-4 w-4 mr-2" />
          View Full Competitive Analysis
        </Button>
      </CardContent>
    </Card>
  )
}
