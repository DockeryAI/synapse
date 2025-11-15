/**
 * Customer Analysis Tab
 * Post-UVP: Deep customer understanding based on UVP context
 * Shows demographics, location, buying behavior, perceptions, interactions
 */

import * as React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Users,
  MapPin,
  ShoppingCart,
  Eye,
  MessageSquare,
  TrendingUp,
  Sparkles,
  AlertCircle,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface CustomerAnalysisTabProps {
  brandId: string
  brandData?: any
  className?: string
}

export const CustomerAnalysisTab: React.FC<CustomerAnalysisTabProps> = ({
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

      // Mock customer analysis based on UVP
      // TODO: Integrate with actual customer research service
      const mockAnalysis = {
        demographics: {
          primaryAge: '25-45',
          gender: 'Mixed (52% F, 48% M)',
          income: '$50k-$150k',
          education: 'College educated (75%)',
          occupation: 'Professionals, Knowledge workers',
        },
        location: {
          primary: 'Urban centers',
          secondary: 'Suburban areas',
          topCities: ['New York', 'San Francisco', 'Chicago', 'Austin', 'Seattle'],
          reach: 'National with international potential',
        },
        buyingBehavior: {
          journey: 'Research-heavy, comparison shoppers',
          avgCycleLength: '14-30 days',
          primaryChannel: 'Online (web + mobile)',
          decisionFactors: ['Quality', 'Value', 'Trust', 'Convenience'],
          pricesensitivity: 'Medium',
        },
        perceptions: [
          {
            attribute: 'Quality',
            score: 85,
            sentiment: 'Very positive',
            feedback: 'Customers consistently praise product/service quality',
          },
          {
            attribute: 'Value',
            score: 72,
            sentiment: 'Positive',
            feedback: 'Good value proposition but price concerns exist',
          },
          {
            attribute: 'Innovation',
            score: 78,
            sentiment: 'Positive',
            feedback: 'Seen as forward-thinking and innovative',
          },
          {
            attribute: 'Trust',
            score: 80,
            sentiment: 'Very positive',
            feedback: 'Strong brand trust and reliability',
          },
        ],
        interactions: [
          { channel: 'Website', frequency: 'High', engagement: 'Strong' },
          { channel: 'Email', frequency: 'Medium', engagement: 'Medium' },
          { channel: 'Social Media', frequency: 'Medium', engagement: 'Growing' },
          { channel: 'In-Store', frequency: 'Low', engagement: 'High' },
        ],
        insights: [
          'Target audience values quality and innovation',
          'Strong brand loyalty among existing customers',
          'Opportunity to improve price perception communication',
          'Digital-first audience with mobile preference',
        ],
      }

      setAnalysis(mockAnalysis)
    } catch (err) {
      console.error('[CustomerAnalysisTab] Analysis failed:', err)
      setError(err instanceof Error ? err.message : 'Customer analysis failed')
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

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold mb-1">Customer Analysis</h3>
            <p className="text-sm text-muted-foreground">
              Deep understanding of who your customers are and how they engage with you
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
            <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm text-muted-foreground">Loading customer analysis...</p>
          </Card>
        )}

        {analysis && (
          <>
            {/* Demographics */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">Demographics</h4>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(analysis.demographics).map(([key, value]) => (
                  <div key={key}>
                    <p className="text-xs text-muted-foreground mb-1 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                    <p className="text-sm font-medium">{value as string}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Location */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">Location & Reach</h4>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Primary Markets</p>
                    <p className="text-sm font-medium">{analysis.location.primary}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Secondary Markets</p>
                    <p className="text-sm font-medium">{analysis.location.secondary}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Top Cities</p>
                  <div className="flex flex-wrap gap-2">
                    {analysis.location.topCities.map((city: string) => (
                      <Badge key={city} variant="secondary">
                        {city}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Buying Behavior */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <ShoppingCart className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">Buying Behavior</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(analysis.buyingBehavior).map(([key, value]) => (
                  <div key={key}>
                    <p className="text-xs text-muted-foreground mb-1 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                    {Array.isArray(value) ? (
                      <div className="flex flex-wrap gap-1">
                        {value.map((item) => (
                          <Badge key={item} variant="outline" className="text-xs">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm font-medium">{value as string}</p>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Brand Perceptions */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Eye className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">Brand Perceptions</h4>
              </div>
              <div className="space-y-4">
                {analysis.perceptions.map((perception: any) => (
                  <div key={perception.attribute}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{perception.attribute}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant={perception.score >= 80 ? 'default' : 'secondary'}>
                          {perception.score}/100
                        </Badge>
                        <span className="text-xs text-muted-foreground">{perception.sentiment}</span>
                      </div>
                    </div>
                    <Progress value={perception.score} className="h-2 mb-1" />
                    <p className="text-xs text-muted-foreground">{perception.feedback}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Interactions */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">Customer Interactions</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {analysis.interactions.map((interaction: any) => (
                  <Card key={interaction.channel} className="p-4 bg-muted/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{interaction.channel}</span>
                      <Badge variant="outline" className="text-xs">
                        {interaction.engagement}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Frequency: {interaction.frequency}
                    </p>
                  </Card>
                ))}
              </div>
            </Card>

            {/* Key Insights */}
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <h4 className="font-semibold">Key Insights</h4>
              </div>
              <ul className="space-y-2">
                {analysis.insights.map((insight: string, idx: number) => (
                  <li key={idx} className="text-sm flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>{insight}</span>
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
