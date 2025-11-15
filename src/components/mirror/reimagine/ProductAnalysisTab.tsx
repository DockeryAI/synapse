/**
 * Product Analysis Tab
 * Post-UVP: How does your product/service deliver value
 * Analyzes value delivery based on UVP promise
 */

import * as React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Package,
  Star,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Sparkles,
  AlertCircle,
  Target,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface ProductAnalysisTabProps {
  brandId: string
  brandData?: any
  className?: string
}

export const ProductAnalysisTab: React.FC<ProductAnalysisTabProps> = ({
  brandId,
  brandData,
  className,
}) => {
  const [isAnalyzing, setIsAnalyzing] = React.useState(false)
  const [analysis, setAnalysis] = React.useState<any>(null)
  const [error, setError] = React.useState<string | null>(null)

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    setError(null)

    try {
      // Get UVP data
      const { data: uvpData } = await supabase
        .from('value_statements')
        .select('*')
        .eq('brand_id', brandId)
        .eq('is_primary', true)
        .maybeSingle()

      if (!uvpData) {
        setError('No UVP found. Please complete your Value Proposition first.')
        setIsAnalyzing(false)
        return
      }

      // Mock product analysis based on UVP
      // TODO: Integrate with actual value delivery service
      const mockAnalysis = {
        uvpAlignment: {
          score: 82,
          status: 'Strong alignment',
          summary:
            'Your product delivers well on your promised value proposition with some areas for improvement',
        },
        valueDelivery: [
          {
            component: 'Target Customer Fit',
            score: 88,
            status: 'excellent',
            promise: uvpData.target_customer || 'Professionals seeking quality solutions',
            delivery: 'Product features and positioning strongly match target needs',
            gap: null,
          },
          {
            component: 'Problem Solving',
            score: 85,
            status: 'strong',
            promise: uvpData.problem_solved || 'Streamline complex workflows',
            delivery: 'Core features address primary pain points effectively',
            gap: 'Some edge cases not fully covered',
          },
          {
            component: 'Unique Solution',
            score: 78,
            status: 'good',
            promise: uvpData.unique_solution || 'AI-powered automation',
            delivery: 'Differentiation clear but could be stronger',
            gap: 'Competitors catching up on key differentiators',
          },
          {
            component: 'Key Benefit',
            score: 80,
            status: 'good',
            promise: uvpData.key_benefit || 'Save 10 hours per week',
            delivery: 'Users report average time savings of 8-12 hours',
            gap: 'Benefit communication could be clearer',
          },
        ],
        strengths: [
          {
            area: 'Core Functionality',
            description: 'Robust feature set that addresses primary use cases',
            impact: 'High user satisfaction and retention',
          },
          {
            area: 'User Experience',
            description: 'Intuitive interface with low learning curve',
            impact: 'Quick adoption and positive reviews',
          },
          {
            area: 'Reliability',
            description: '99.9% uptime and consistent performance',
            impact: 'Strong trust and enterprise adoption',
          },
        ],
        weaknesses: [
          {
            area: 'Advanced Features',
            description: 'Some power-user features missing or limited',
            impact: 'Limited appeal to enterprise segment',
            priority: 'High',
          },
          {
            area: 'Mobile Experience',
            description: 'Mobile app functionality lags behind web',
            impact: 'Lower engagement from mobile users',
            priority: 'Medium',
          },
        ],
        opportunities: [
          'Expand integration ecosystem',
          'Add AI-powered recommendations',
          'Develop mobile-first features',
          'Create team collaboration tools',
        ],
        metrics: {
          satisfaction: { score: 4.2, max: 5, label: 'User Satisfaction' },
          nps: { score: 42, max: 100, label: 'Net Promoter Score' },
          retention: { score: 85, max: 100, label: '12-Month Retention' },
          timeToValue: { score: 78, max: 100, label: 'Time to Value' },
        },
      }

      setAnalysis(mockAnalysis)
    } catch (err) {
      console.error('[ProductAnalysisTab] Analysis failed:', err)
      setError(err instanceof Error ? err.message : 'Product analysis failed')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Auto-analyze on mount
  React.useEffect(() => {
    if (brandData && !analysis && !isAnalyzing && !error) {
      handleAnalyze()
    }
  }, [brandData])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'text-green-600 dark:text-green-400'
      case 'strong':
      case 'good':
        return 'text-blue-600 dark:text-blue-400'
      default:
        return 'text-orange-600 dark:text-orange-400'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold mb-1">Product Analysis</h3>
            <p className="text-sm text-muted-foreground">
              How your product/service delivers on your value proposition
            </p>
          </div>
          <Button onClick={handleAnalyze} disabled={isAnalyzing} size="sm">
            <Sparkles className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
            {isAnalyzing ? 'Analyzing...' : analysis ? 'Refresh' : 'Analyze'}
          </Button>
        </div>

        {error && (
          <Card className="p-4 border-destructive bg-destructive/10">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Analysis Error</p>
                <p className="text-sm text-destructive/80">{error}</p>
              </div>
            </div>
          </Card>
        )}

        {!analysis && !isAnalyzing && !error && (
          <Card className="p-12 text-center">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm text-muted-foreground">Loading product analysis...</p>
          </Card>
        )}

        {analysis && (
          <>
            {/* UVP Alignment Score */}
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold">UVP Alignment</h4>
                <div className="flex items-center gap-2">
                  <span className={`text-3xl font-bold ${getScoreColor(analysis.uvpAlignment.score)}`}>
                    {analysis.uvpAlignment.score}
                  </span>
                  <span className="text-xl text-muted-foreground">/100</span>
                </div>
              </div>
              <Progress value={analysis.uvpAlignment.score} className="h-3 mb-3" />
              <p className="text-sm">
                <span className="font-medium">{analysis.uvpAlignment.status}:</span>{' '}
                {analysis.uvpAlignment.summary}
              </p>
            </Card>

            {/* Value Delivery Components */}
            <div>
              <h4 className="font-semibold mb-4">Value Delivery Analysis</h4>
              <div className="space-y-3">
                {analysis.valueDelivery.map((component: any, idx: number) => (
                  <Card key={idx} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {component.gap ? (
                          <XCircle className="h-5 w-5 text-orange-600" />
                        ) : (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium">{component.component}</h5>
                          <Badge variant={component.score >= 80 ? 'default' : 'secondary'}>
                            {component.score}/100
                          </Badge>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium">UVP Promise:</span>
                            <p className="text-muted-foreground">{component.promise}</p>
                          </div>
                          <div>
                            <span className="font-medium">Delivery:</span>
                            <p className="text-muted-foreground">{component.delivery}</p>
                          </div>
                          {component.gap && (
                            <div className="p-2 bg-orange-50 dark:bg-orange-950/20 rounded">
                              <span className="font-medium text-orange-900 dark:text-orange-100">
                                Gap:
                              </span>
                              <p className="text-sm text-orange-700 dark:text-orange-300">
                                {component.gap}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Strengths */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Star className="h-5 w-5 text-green-600" />
                  <h4 className="font-semibold">Strengths</h4>
                </div>
                <div className="space-y-3">
                  {analysis.strengths.map((strength: any, idx: number) => (
                    <div key={idx} className="p-3 bg-green-50 dark:bg-green-950/20 rounded">
                      <h5 className="font-medium text-sm mb-1">{strength.area}</h5>
                      <p className="text-xs text-muted-foreground mb-2">{strength.description}</p>
                      <Badge variant="outline" className="text-xs">
                        {strength.impact}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Weaknesses */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  <h4 className="font-semibold">Areas for Improvement</h4>
                </div>
                <div className="space-y-3">
                  {analysis.weaknesses.map((weakness: any, idx: number) => (
                    <div key={idx} className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded">
                      <div className="flex items-center justify-between mb-1">
                        <h5 className="font-medium text-sm">{weakness.area}</h5>
                        <Badge variant={weakness.priority === 'High' ? 'destructive' : 'secondary'} className="text-xs">
                          {weakness.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{weakness.description}</p>
                      <p className="text-xs text-orange-700 dark:text-orange-300">{weakness.impact}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Key Metrics */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">Key Product Metrics</h4>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(analysis.metrics).map(([key, metric]: [string, any]) => (
                  <div key={key} className="text-center">
                    <div className={`text-2xl font-bold mb-1 ${getScoreColor((metric.score / metric.max) * 100)}`}>
                      {metric.score}
                      {key === 'satisfaction' ? '' : metric.max === 100 ? '%' : `/${metric.max}`}
                    </div>
                    <p className="text-xs text-muted-foreground">{metric.label}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Opportunities */}
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <h4 className="font-semibold">Growth Opportunities</h4>
              </div>
              <ul className="space-y-2">
                {analysis.opportunities.map((opportunity: string, idx: number) => (
                  <li key={idx} className="text-sm flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>{opportunity}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
