/**
 * Competitor Opportunities Tab
 * Post-UVP: Content and keyword gaps based on unique differentiators
 * Shows opportunities to exploit competitor weaknesses
 */

import * as React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Target,
  TrendingUp,
  Search,
  FileText,
  Sparkles,
  AlertCircle,
  Zap,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface CompetitorOpportunitiesTabProps {
  brandId: string
  brandData?: any
  className?: string
}

export const CompetitorOpportunitiesTab: React.FC<CompetitorOpportunitiesTabProps> = ({
  brandId,
  brandData,
  className,
}) => {
  const [isAnalyzing, setIsAnalyzing] = React.useState(false)
  const [opportunities, setOpportunities] = React.useState<any>(null)
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

      // Mock competitor opportunities based on UVP differentiators
      // TODO: Integrate with actual competitive intelligence and SEO services
      const mockOpportunities = {
        keywordGaps: [
          {
            keyword: 'AI-powered workflow automation',
            difficulty: 'Medium',
            volume: 2400,
            competitorCoverage: 'Weak',
            opportunity: 'High - matches your unique solution',
            reason: 'Competitors focus on manual processes, your AI approach is underserved',
          },
          {
            keyword: 'enterprise collaboration tools comparison',
            difficulty: 'Low',
            volume: 1800,
            competitorCoverage: 'None',
            opportunity: 'Very High',
            reason: 'No competitor has comprehensive comparison content',
          },
          {
            keyword: 'time-saving productivity hacks',
            difficulty: 'Medium',
            volume: 3200,
            competitorCoverage: 'Medium',
            opportunity: 'Medium - align with key benefit',
            reason: 'Your "10 hours saved" benefit resonates here',
          },
        ],
        contentGaps: [
          {
            type: 'How-to Guide',
            topic: 'Automating repetitive tasks with AI',
            gap: 'Competitors have basic guides, none leverage AI angle',
            opportunity: 'Create definitive AI automation guide',
            impact: 'High',
            effort: 'Medium',
          },
          {
            type: 'Case Study',
            topic: 'Enterprise transformation with your solution',
            gap: 'Competitors show small business wins only',
            opportunity: 'Showcase enterprise-scale success',
            impact: 'Very High',
            effort: 'Low',
          },
          {
            type: 'Comparison',
            topic: 'vs. Traditional manual workflows',
            gap: 'No one directly compares against status quo',
            opportunity: 'Position as revolutionary alternative',
            impact: 'High',
            effort: 'Low',
          },
          {
            type: 'Tutorial Video',
            topic: 'Quick wins in first 24 hours',
            gap: 'Competitors have long onboarding content',
            opportunity: 'Create fast time-to-value content',
            impact: 'Medium',
            effort: 'Medium',
          },
        ],
        messagingGaps: [
          {
            angle: 'Time ROI Calculator',
            what: 'Interactive tool showing exact time savings',
            why: 'Competitors only make vague efficiency claims',
            howToExecute: 'Build calculator widget for landing pages',
          },
          {
            angle: 'AI Transparency',
            what: 'Explain how AI makes decisions',
            why: 'Competitors hide AI as "magic", users want understanding',
            howToExecute: 'Create educational content series on AI workings',
          },
          {
            angle: 'Mobile-First Productivity',
            what: 'Position as solution for on-the-go work',
            why: 'Competitors are desktop-centric',
            howToExecute: 'Feature mobile capabilities prominently',
          },
        ],
        strategicMoves: [
          {
            move: 'Own "AI Automation" Category',
            rationale: 'Competitors stuck in legacy "workflow management" positioning',
            actions: [
              'Create thought leadership content on AI in workflows',
              'Launch AI Automation Conference or Summit',
              'Publish annual "State of AI Automation" report',
            ],
            timeline: '3-6 months',
            impact: 'Category creation opportunity',
          },
          {
            move: 'Enterprise Credibility Play',
            rationale: 'Your solution works for enterprise but positioned as SMB',
            actions: [
              'Publish enterprise case studies',
              'Create enterprise-specific landing pages',
              'Sponsor enterprise conferences',
            ],
            timeline: '1-3 months',
            impact: 'Unlock higher-value segment',
          },
        ],
      }

      setOpportunities(mockOpportunities)
    } catch (err) {
      console.error('[CompetitorOpportunitiesTab] Analysis failed:', err)
      setError(err instanceof Error ? err.message : 'Opportunity analysis failed')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Auto-analyze on mount
  React.useEffect(() => {
    if (brandData && !opportunities && !isAnalyzing && !error) {
      handleAnalyze()
    }
  }, [brandData])

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'low':
        return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300'
      case 'high':
        return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold mb-1">Competitor Opportunities</h3>
            <p className="text-sm text-muted-foreground">
              Keyword and content gaps to exploit based on your unique differentiators
            </p>
          </div>
          <Button onClick={handleAnalyze} disabled={isAnalyzing} size="sm">
            <Sparkles className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
            {isAnalyzing ? 'Analyzing...' : opportunities ? 'Refresh' : 'Analyze'}
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

        {!opportunities && !isAnalyzing && !error && (
          <Card className="p-12 text-center">
            <Target className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm text-muted-foreground">Loading opportunity analysis...</p>
          </Card>
        )}

        {opportunities && (
          <>
            {/* Keyword Gaps */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Search className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">High-Priority Keyword Opportunities</h4>
              </div>
              <div className="space-y-3">
                {opportunities.keywordGaps.map((gap: any, idx: number) => (
                  <Card key={idx} className="p-4 bg-muted/50">
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="font-medium">{gap.keyword}</h5>
                      <Badge className={getDifficultyColor(gap.difficulty)}>{gap.difficulty}</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs mb-2">
                      <div>
                        <span className="text-muted-foreground">Volume:</span>
                        <span className="ml-1 font-medium">{gap.volume.toLocaleString()}/mo</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Competition:</span>
                        <span className="ml-1 font-medium">{gap.competitorCoverage}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Opportunity:</span>
                        <span className="ml-1 font-medium text-green-600">{gap.opportunity}</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <Zap className="h-3 w-3 inline mr-1" />
                      {gap.reason}
                    </p>
                  </Card>
                ))}
              </div>
            </Card>

            {/* Content Gaps */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">Content Gap Opportunities</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {opportunities.contentGaps.map((gap: any, idx: number) => (
                  <Card key={idx} className="p-4 border-l-4 border-l-primary">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">{gap.type}</Badge>
                      <div className="flex gap-1">
                        <Badge variant={gap.impact === 'Very High' || gap.impact === 'High' ? 'default' : 'secondary'} className="text-xs">
                          {gap.impact}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {gap.effort} effort
                        </Badge>
                      </div>
                    </div>
                    <h5 className="font-medium text-sm mb-2">{gap.topic}</h5>
                    <p className="text-xs text-muted-foreground mb-2">
                      <span className="font-medium">Gap:</span> {gap.gap}
                    </p>
                    <p className="text-xs text-primary">
                      <Target className="h-3 w-3 inline mr-1" />
                      {gap.opportunity}
                    </p>
                  </Card>
                ))}
              </div>
            </Card>

            {/* Messaging Gaps */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">Messaging Angle Opportunities</h4>
              </div>
              <div className="space-y-3">
                {opportunities.messagingGaps.map((gap: any, idx: number) => (
                  <Card key={idx} className="p-4 bg-blue-50 dark:bg-blue-950/20">
                    <h5 className="font-medium mb-2">{gap.angle}</h5>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">What:</span>
                        <p className="text-muted-foreground">{gap.what}</p>
                      </div>
                      <div>
                        <span className="font-medium">Why it works:</span>
                        <p className="text-muted-foreground">{gap.why}</p>
                      </div>
                      <div className="p-2 bg-white dark:bg-gray-900 rounded">
                        <span className="font-medium">How to execute:</span>
                        <p className="text-xs">{gap.howToExecute}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>

            {/* Strategic Moves */}
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="h-5 w-5 text-purple-600" />
                <h4 className="font-semibold">Strategic Competitive Moves</h4>
              </div>
              <div className="space-y-4">
                {opportunities.strategicMoves.map((move: any, idx: number) => (
                  <Card key={idx} className="p-4 bg-white dark:bg-gray-900">
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="font-medium">{move.move}</h5>
                      <Badge className="bg-purple-600 text-white">{move.impact}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{move.rationale}</p>
                    <div className="mb-3">
                      <p className="text-xs font-medium mb-2">Action Plan:</p>
                      <ul className="space-y-1">
                        {move.actions.map((action: string, i: number) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                            <span className="text-purple-600 mt-0.5">•</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Timeline: {move.timeline}
                    </Badge>
                  </Card>
                ))}
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
