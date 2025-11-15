import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CompetitiveDifferentiation, StrategyBuilder } from '@/services/mirror/strategy-builder'
import { Swords, Lightbulb, BarChart3, Sparkles, TrendingUp, AlertCircle } from 'lucide-react'

interface CompetitiveStrategyProps {
  brandData: any
  competitors: any[]
  industry: string
  onSave?: (strategy: any) => void
  className?: string
}

export const CompetitiveStrategy: React.FC<CompetitiveStrategyProps> = ({
  brandData,
  competitors,
  industry,
  onSave,
  className,
}) => {
  const [differentiators, setDifferentiators] = React.useState<CompetitiveDifferentiation[]>([])
  const [whiteSpace, setWhiteSpace] = React.useState<string[]>([])
  const [messageSaturation, setMessageSaturation] = React.useState<Record<string, 'low' | 'medium' | 'high'>>({})
  const [isGenerating, setIsGenerating] = React.useState(false)

  React.useEffect(() => {
    if (brandData && competitors.length > 0) {
      generateCompetitiveStrategy()
    }
  }, [brandData, competitors])

  const generateCompetitiveStrategy = async () => {
    setIsGenerating(true)
    try {
      const generatedDiff = StrategyBuilder.analyzeCompetitiveDifferentiation(brandData, competitors)
      const generatedWhiteSpace = StrategyBuilder.identifyWhiteSpace(industry, competitors)
      const generatedSaturation = StrategyBuilder.analyzeMessageSaturation(industry)

      setDifferentiators(generatedDiff)
      setWhiteSpace(generatedWhiteSpace)
      setMessageSaturation(generatedSaturation)
    } catch (error) {
      console.error('Failed to generate competitive strategy:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'strong':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'moderate':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'weak':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getSaturationBadge = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'low':
        return <Badge variant="default" className="bg-green-500">Low Saturation - Opportunity!</Badge>
      case 'medium':
        return <Badge variant="secondary">Medium Saturation</Badge>
      case 'high':
        return <Badge variant="destructive">High Saturation - Avoid</Badge>
    }
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Swords className="h-5 w-5 text-primary" />
              <CardTitle>Competitive Strategy</CardTitle>
            </div>
            <Button size="sm" variant="outline" onClick={generateCompetitiveStrategy} disabled={isGenerating}>
              <Sparkles className="h-4 w-4 mr-2" />
              {isGenerating ? 'Analyzing...' : 'Reanalyze'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Differentiators */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <h3 className="font-semibold">Competitive Differentiators</h3>
            </div>

            {differentiators.length === 0 ? (
              <Card className="p-6 text-center">
                <Swords className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="text-muted-foreground">No differentiators analyzed yet</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {differentiators.map((diff, i) => (
                  <Card key={i} className={`p-4 border-l-4 ${getStrengthColor(diff.strength)}`}>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{diff.differentiator}</h4>
                        <Badge
                          variant={diff.strength === 'strong' ? 'default' : 'secondary'}
                          className={
                            diff.strength === 'strong'
                              ? 'bg-green-500'
                              : diff.strength === 'moderate'
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                          }
                        >
                          {diff.strength} position
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Your Position:</p>
                          <p>{diff.your_position}</p>
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Competitor Position:</p>
                          <p className="text-muted-foreground">{diff.competitor_position}</p>
                        </div>
                      </div>

                      <div className="pt-2 border-t">
                        <p className="font-medium text-sm mb-1 flex items-center gap-2">
                          <Lightbulb className="h-3 w-3" />
                          Message Opportunity:
                        </p>
                        <p className="text-sm">{diff.message_opportunity}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* White Space Opportunities */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              <h3 className="font-semibold">White Space Opportunities</h3>
            </div>

            {whiteSpace.length === 0 ? (
              <Card className="p-6 text-center">
                <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="text-muted-foreground">No opportunities identified yet</p>
              </Card>
            ) : (
              <Card className="p-4 bg-blue-50 border-blue-200">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    These are underserved market opportunities where you can establish a strong position:
                  </p>
                  <ul className="space-y-2">
                    {whiteSpace.map((opportunity, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-blue-600 font-bold">✓</span>
                        <span className="flex-1">{opportunity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            )}
          </div>

          {/* Message Saturation Analysis */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <h3 className="font-semibold">Message Saturation Analysis</h3>
            </div>

            {Object.keys(messageSaturation).length === 0 ? (
              <Card className="p-6 text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="text-muted-foreground">No saturation analysis yet</p>
              </Card>
            ) : (
              <div className="space-y-2">
                <Card className="p-3 bg-muted/50">
                  <div className="flex items-start gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 mt-0.5" />
                    <p>
                      Focus on <strong>low saturation</strong> messages to stand out. Avoid oversaturated themes that
                      make differentiation difficult.
                    </p>
                  </div>
                </Card>

                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(messageSaturation)
                    .sort((a, b) => {
                      const order = { low: 0, medium: 1, high: 2 }
                      return order[a[1]] - order[b[1]]
                    })
                    .map(([message, level]) => (
                      <Card key={message} className="p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{message}</span>
                          {getSaturationBadge(level)}
                        </div>
                      </Card>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Strategic Recommendations */}
          <Card className="p-4 border-l-4 border-l-primary bg-primary/5">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Strategic Recommendations
            </h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-primary">→</span>
                <span>
                  <strong>Lead with your strong differentiators</strong> in all marketing materials and sales
                  conversations
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">→</span>
                <span>
                  <strong>Claim white space opportunities</strong> through thought leadership and product positioning
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">→</span>
                <span>
                  <strong>Avoid oversaturated messages</strong> and find unique angles on competitive themes
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">→</span>
                <span>
                  <strong>Monitor competitor positioning</strong> regularly to maintain your competitive advantage
                </span>
              </li>
            </ul>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}
