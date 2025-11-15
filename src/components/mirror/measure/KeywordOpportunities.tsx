/**
 * Keyword Opportunities Component
 * Displays keyword opportunities with one-click Synapse content generation
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Sparkles, TrendingUp, Target, Clock,
  Search, Zap, CheckCircle2, Copy
} from 'lucide-react'
import type { KeywordOpportunity } from '@/services/intelligence/semrush-api'
import { generateWithSynapse } from '@/lib/openrouter'
import { Textarea } from '@/components/ui/textarea'

interface KeywordOpportunitiesProps {
  opportunities: KeywordOpportunity[]
  brandProfile?: any
}

export function KeywordOpportunities({ opportunities, brandProfile }: KeywordOpportunitiesProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedKeyword, setSelectedKeyword] = useState<KeywordOpportunity | null>(null)
  const [generatedContent, setGeneratedContent] = useState<string>('')
  const [psychologyScore, setPsychologyScore] = useState<number>(0)
  const [showDialog, setShowDialog] = useState(false)
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({})

  if (!opportunities || opportunities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Keyword Opportunities
          </CardTitle>
          <CardDescription>
            No keyword opportunities found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Keyword opportunities will appear here once SEO analysis is complete.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Group opportunities by type
  const quickWins = opportunities.filter(o => o.opportunity === 'quick-win')
  const highValue = opportunities.filter(o => o.opportunity === 'high-value')
  const longTerm = opportunities.filter(o => o.opportunity === 'long-term')

  const getOpportunityIcon = (type: string) => {
    switch (type) {
      case 'quick-win':
        return <Zap className="h-4 w-4" />
      case 'high-value':
        return <Target className="h-4 w-4" />
      case 'long-term':
        return <Clock className="h-4 w-4" />
      default:
        return <Search className="h-4 w-4" />
    }
  }

  const getOpportunityColor = (type: string) => {
    switch (type) {
      case 'quick-win':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'high-value':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'long-term':
        return 'bg-purple-100 text-purple-800 border-purple-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const handleGenerateContent = async (opportunity: KeywordOpportunity) => {
    setIsGenerating(true)
    setSelectedKeyword(opportunity)
    setShowDialog(true)
    setGeneratedContent('')
    setPsychologyScore(0)

    try {
      // Generate SEO-optimized content using Synapse + OpenRouter
      const brandVoice = brandProfile?.full_profile_data?.brand_voice || 'professional'
      const industry = brandProfile?.full_profile_data?.industry || ''
      const emotionalTriggers = brandProfile?.full_profile_data?.emotional_triggers || []

      const audienceInsights = emotionalTriggers
        .slice(0, 3)
        .map((t: any) => t.trigger || '')
        .filter(Boolean)

      console.log('[KeywordOpportunities] Generating content for:', opportunity.keyword)

      // Call REAL OpenRouter API with Synapse psychology
      const result = await generateWithSynapse({
        platform: 'blog',
        topic: `${opportunity.keyword} - ${opportunity.reasoning}`,
        tone: brandVoice,
        length: 'medium',
        industryContext: industry,
        audienceInsights,
        edginess: 50
      })

      console.log('[KeywordOpportunities] Generated content, score:', result.psychologyScore)

      setGeneratedContent(result.text)
      setPsychologyScore(result.psychologyScore)
    } catch (error) {
      console.error('[KeywordOpportunities] Error generating content:', error)

      // Show CLEAR error message
      const errorMessage = error instanceof Error
        ? error.message
        : 'Unknown error occurred'

      setGeneratedContent(
        `❌ Content generation failed:\n\n${errorMessage}\n\n` +
        `To enable Synapse content generation:\n` +
        `1. Add VITE_OPENROUTER_API_KEY to your .env file\n` +
        `2. Get a free API key from https://openrouter.ai/\n` +
        `3. Restart the development server`
      )
      setPsychologyScore(0)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopyContent = (keyword: string) => {
    navigator.clipboard.writeText(generatedContent)
    setCopiedStates({ ...copiedStates, [keyword]: true })
    setTimeout(() => {
      setCopiedStates({ ...copiedStates, [keyword]: false })
    }, 2000)
  }

  const renderOpportunityCard = (opportunity: KeywordOpportunity) => (
    <div
      key={opportunity.keyword}
      className={`rounded-lg border p-4 space-y-3 ${getOpportunityColor(opportunity.opportunity)}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            {getOpportunityIcon(opportunity.opportunity)}
            <h4 className="font-semibold">{opportunity.keyword}</h4>
          </div>
          <p className="text-xs opacity-80">
            {opportunity.reasoning}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <div className="opacity-70">Search Volume</div>
          <div className="font-semibold">
            {opportunity.searchVolume.toLocaleString()}/mo
          </div>
        </div>
        <div>
          <div className="opacity-70">Difficulty</div>
          <div className="font-semibold">{opportunity.difficulty}%</div>
        </div>
        <div>
          <div className="opacity-70">Est. Traffic</div>
          <div className="font-semibold">
            {opportunity.estimatedTraffic.toLocaleString()}
          </div>
        </div>
      </div>

      {opportunity.currentPosition && (
        <div className="text-xs opacity-80">
          Current Rank: #{opportunity.currentPosition}
        </div>
      )}

      <Button
        onClick={() => handleGenerateContent(opportunity)}
        className="w-full"
        size="sm"
        disabled={isGenerating}
      >
        <Sparkles className="h-4 w-4 mr-2" />
        Generate Content with Synapse
      </Button>
    </div>
  )

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Keyword Opportunities
          </CardTitle>
          <CardDescription>
            {opportunities.length} opportunities to boost your SEO
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quick Wins */}
          {quickWins.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-lg">
                  Quick Wins ({quickWins.length})
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Keywords ranked 11-20 that can quickly move to page 1
              </p>
              <div className="space-y-2">
                {quickWins.slice(0, 5).map(renderOpportunityCard)}
              </div>
            </div>
          )}

          {/* High Value */}
          {highValue.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-lg">
                  High Value ({highValue.length})
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                High search volume keywords worth targeting
              </p>
              <div className="space-y-2">
                {highValue.slice(0, 5).map(renderOpportunityCard)}
              </div>
            </div>
          )}

          {/* Long Term */}
          {longTerm.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold text-lg">
                  Long Term ({longTerm.length})
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Competitive keywords that require sustained effort
              </p>
              <div className="space-y-2">
                {longTerm.slice(0, 3).map(renderOpportunityCard)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content Generation Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Generated Content: {selectedKeyword?.keyword}
            </DialogTitle>
            <DialogDescription>
              SEO-optimized content generated with Synapse psychology engine
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Psychology Score */}
            {psychologyScore > 0 && (
              <div className="rounded-lg bg-primary/5 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Psychology Score</span>
                  <Badge variant={psychologyScore >= 7 ? 'default' : 'secondary'}>
                    {psychologyScore.toFixed(1)}/10
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {psychologyScore >= 8 && 'Excellent! Strong emotional appeal and persuasive language.'}
                  {psychologyScore >= 6 && psychologyScore < 8 && 'Good balance of logic and emotion.'}
                  {psychologyScore < 6 && 'Could benefit from more emotional triggers.'}
                </div>
              </div>
            )}

            {/* Generated Content */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-medium">Generated Content</label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyContent(selectedKeyword?.keyword || '')}
                >
                  {copiedStates[selectedKeyword?.keyword || ''] ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </div>

              {isGenerating ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  <span className="ml-3 text-muted-foreground">
                    Generating content...
                  </span>
                </div>
              ) : (
                <Textarea
                  value={generatedContent}
                  onChange={(e) => setGeneratedContent(e.target.value)}
                  rows={12}
                  className="font-mono text-sm"
                />
              )}
            </div>

            {/* Keyword Metrics Reminder */}
            {selectedKeyword && (
              <div className="rounded-lg border p-3 text-sm bg-muted/50">
                <div className="font-medium mb-2">Keyword Metrics</div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Volume:</span>{' '}
                    <span className="font-semibold">
                      {selectedKeyword.searchVolume.toLocaleString()}/mo
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Difficulty:</span>{' '}
                    <span className="font-semibold">{selectedKeyword.difficulty}%</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Est. Traffic:</span>{' '}
                    <span className="font-semibold">
                      {selectedKeyword.estimatedTraffic.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// NO MOCK DATA - removed
// Real content generation now uses OpenRouter API via generateWithSynapse()
// Configure VITE_OPENROUTER_API_KEY in .env to enable this feature
