import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { BrandHealthScore } from '@/services/mirror/situation-analyzer'
import { TrendingUp, AlertCircle, CheckCircle2, ChevronDown, ChevronRight } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'

interface BrandHealthCardProps {
  health: BrandHealthScore
  hotSpots: string[]
  attentionNeeded: string[]
  industryAverage?: number
  className?: string
  brandHealthDetails?: any  // Full details from BrandHealthCalculator
}

export const BrandHealthCard: React.FC<BrandHealthCardProps> = ({
  health,
  hotSpots,
  attentionNeeded,
  industryAverage = 65,
  className,
  brandHealthDetails,
}) => {
  const scoreColor = health.overall >= 75 ? 'text-green-600' : health.overall >= 60 ? 'text-orange-600' : 'text-red-600'
  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>({})

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Brand Health</CardTitle>
          <Badge variant={health.overall >= industryAverage ? 'success' : 'warning'}>
            {health.overall >= industryAverage ? 'Above' : 'Below'} Industry Avg
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score Gauge */}
        <div className="text-center space-y-2">
          <div className={`text-6xl font-bold ${scoreColor}`}>{health.overall}</div>
          <div className="text-sm text-muted-foreground">Overall Health Score</div>
          <div className="text-xs text-muted-foreground">
            Industry Average: {industryAverage}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="space-y-3">
          <MetricBar label="Clarity" value={health.clarity} />
          <MetricBar label="Consistency" value={health.consistency} />
          <MetricBar label="Engagement" value={health.engagement} />
          <MetricBar label="Differentiation" value={health.differentiation} />
        </div>

        {/* Hot Spots */}
        {hotSpots.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Hot Spots</span>
            </div>
            <div className="space-y-1">
              {hotSpots.map((spot, i) => (
                <div key={i} className="text-sm text-muted-foreground pl-6">
                  • {spot}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attention Needed - WITH DETAILED EXPLANATIONS */}
        {brandHealthDetails && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <span>Attention Needed</span>
            </div>

            {/* Clarity Issues */}
            {brandHealthDetails.clarity && brandHealthDetails.clarity.score < 70 && (
              <Collapsible open={openSections['clarity']} onOpenChange={() => toggleSection('clarity')}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start p-2 h-auto text-left">
                    <div className="flex items-center gap-2 w-full">
                      {openSections['clarity'] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      <span className="text-sm">Brand clarity needs improvement ({brandHealthDetails.clarity.score}%)</span>
                    </div>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-6 pr-2 pb-2 space-y-2">
                  <div className="text-xs text-muted-foreground">{brandHealthDetails.clarity.description}</div>
                  {brandHealthDetails.clarity.improvements && brandHealthDetails.clarity.improvements.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-xs font-medium">Specific Issues:</div>
                      {brandHealthDetails.clarity.improvements.map((improvement: string, idx: number) => (
                        <div key={idx} className="text-xs text-muted-foreground pl-3">• {improvement}</div>
                      ))}
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Consistency Issues */}
            {brandHealthDetails.consistency && brandHealthDetails.consistency.score < 70 && (
              <Collapsible open={openSections['consistency']} onOpenChange={() => toggleSection('consistency')}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start p-2 h-auto text-left">
                    <div className="flex items-center gap-2 w-full">
                      {openSections['consistency'] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      <span className="text-sm">Inconsistent messaging across channels ({brandHealthDetails.consistency.score}%)</span>
                    </div>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-6 pr-2 pb-2 space-y-2">
                  <div className="text-xs text-muted-foreground">{brandHealthDetails.consistency.description}</div>
                  {brandHealthDetails.consistency.improvements && brandHealthDetails.consistency.improvements.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-xs font-medium">Specific Issues:</div>
                      {brandHealthDetails.consistency.improvements.map((improvement: string, idx: number) => (
                        <div key={idx} className="text-xs text-muted-foreground pl-3">• {improvement}</div>
                      ))}
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Engagement Issues */}
            {brandHealthDetails.engagement && brandHealthDetails.engagement.score < 60 && (
              <Collapsible open={openSections['engagement']} onOpenChange={() => toggleSection('engagement')}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start p-2 h-auto text-left">
                    <div className="flex items-center gap-2 w-full">
                      {openSections['engagement'] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      <span className="text-sm">Low engagement rates ({brandHealthDetails.engagement.score}%)</span>
                    </div>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-6 pr-2 pb-2 space-y-2">
                  <div className="text-xs text-muted-foreground">{brandHealthDetails.engagement.description}</div>
                  {brandHealthDetails.engagement.improvements && brandHealthDetails.engagement.improvements.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-xs font-medium">Specific Issues:</div>
                      {brandHealthDetails.engagement.improvements.map((improvement: string, idx: number) => (
                        <div key={idx} className="text-xs text-muted-foreground pl-3">• {improvement}</div>
                      ))}
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Differentiation Issues */}
            {brandHealthDetails.differentiation && brandHealthDetails.differentiation.score < 60 && (
              <Collapsible open={openSections['differentiation']} onOpenChange={() => toggleSection('differentiation')}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start p-2 h-auto text-left">
                    <div className="flex items-center gap-2 w-full">
                      {openSections['differentiation'] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      <span className="text-sm">Weak market differentiation ({brandHealthDetails.differentiation.score}%)</span>
                    </div>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-6 pr-2 pb-2 space-y-2">
                  <div className="text-xs text-muted-foreground">{brandHealthDetails.differentiation.description}</div>
                  {brandHealthDetails.differentiation.improvements && brandHealthDetails.differentiation.improvements.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-xs font-medium">Specific Issues:</div>
                      {brandHealthDetails.differentiation.improvements.map((improvement: string, idx: number) => (
                        <div key={idx} className="text-xs text-muted-foreground pl-3">• {improvement}</div>
                      ))}
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

const MetricBar: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between text-sm">
      <span>{label}</span>
      <span className="font-medium">{value}%</span>
    </div>
    <Progress value={value} className="h-2" />
  </div>
)
