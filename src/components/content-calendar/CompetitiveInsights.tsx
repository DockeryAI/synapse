/**
 * Competitive Insights Tab
 * Full competitive analysis powered by 16+ intelligence sources
 */

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Loader2, Search, TrendingUp, TrendingDown, Minus, Target, Zap, AlertTriangle } from 'lucide-react'
import { IndustrySelector } from './IndustrySelector'
import { competitiveIntelligence } from '@/services/intelligence/competitive-intelligence.service'
import type {
  Competitor,
  CompetitorProfile,
  ScoredOpportunity
} from '@/services/intelligence/competitive-intelligence.service'

interface CompetitiveInsightsProps {
  brandId: string
  brandDomain?: string
  onGenerateContent?: (opportunity: ScoredOpportunity) => void
}

export function CompetitiveInsights({
  brandId,
  brandDomain,
  onGenerateContent
}: CompetitiveInsightsProps) {
  // Form state
  const [industry, setIndustry] = useState('')
  const [location, setLocation] = useState('')
  const [ourDomain, setOurDomain] = useState(brandDomain || '')

  // Analysis state
  const [step, setStep] = useState<'input' | 'discovering' | 'profiling' | 'analyzing' | 'results'>('input')
  const [progress, setProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Results
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [ourProfile, setOurProfile] = useState<CompetitorProfile | null>(null)
  const [competitorProfiles, setCompetitorProfiles] = useState<CompetitorProfile[]>([])
  const [opportunities, setOpportunities] = useState<ScoredOpportunity[]>([])

  /**
   * Run full competitive analysis
   */
  const handleAnalyze = async () => {
    if (!industry || !ourDomain) {
      setError('Please enter your domain and select an industry')
      return
    }

    try {
      setError(null)
      setProgress(0)

      // Step 1: Discover competitors
      setStep('discovering')
      setStatusMessage('Discovering competitors...')
      setProgress(10)

      const discovered = await competitiveIntelligence.discoverCompetitors({
        industry,
        location: location || undefined,
        ourDomain,
        limit: 5
      })

      setCompetitors(discovered)
      setProgress(25)

      if (discovered.length === 0) {
        setError('No competitors found. Try a different industry or location.')
        setStep('input')
        return
      }

      // Step 2: Profile all competitors (including ourselves)
      setStep('profiling')
      setStatusMessage(`Profiling ${discovered.length + 1} companies...`)
      setProgress(30)

      const allDomains = [
        { domain: ourDomain, name: 'Your Business', url: `https://${ourDomain}`, source: 'manual' as const },
        ...discovered
      ]

      const profiles: CompetitorProfile[] = []

      for (let i = 0; i < allDomains.length; i++) {
        const comp = allDomains[i]
        setStatusMessage(`Profiling ${comp.name}... (${i + 1}/${allDomains.length})`)

        try {
          const profile = await competitiveIntelligence.profileCompetitor(comp)
          profiles.push(profile)
        } catch (err) {
          console.warn(`Failed to profile ${comp.name}:`, err)
        }

        setProgress(30 + ((i + 1) / allDomains.length) * 40)
      }

      const [our, ...comps] = profiles
      setOurProfile(our)
      setCompetitorProfiles(comps)

      // Step 3: Analyze gaps
      setStep('analyzing')
      setStatusMessage('Analyzing competitive gaps...')
      setProgress(75)

      const [contentGaps, messagingGaps, performanceGaps] = await Promise.all([
        competitiveIntelligence.findContentGaps({
          ourDomain,
          competitors: discovered.map(c => c.domain),
          limit: 20
        }),
        competitiveIntelligence.findMessagingGaps({
          ourProfile: our,
          competitorProfiles: comps
        }),
        competitiveIntelligence.findPerformanceGaps({
          ourProfile: our,
          competitorProfiles: comps
        })
      ])

      setProgress(90)

      // Step 4: Score opportunities
      setStatusMessage('Scoring opportunities...')

      const scored = await competitiveIntelligence.scoreOpportunities({
        contentGaps,
        messagingGaps,
        performanceGaps
      })

      setOpportunities(scored)
      setProgress(100)

      // Show results
      setStep('results')

    } catch (err) {
      console.error('Competitive analysis failed:', err)
      setError(err instanceof Error ? err.message : 'Analysis failed')
      setStep('input')
    }
  }

  /**
   * Render opportunity card
   */
  const renderOpportunity = (opp: ScoredOpportunity) => {
    const difficultyColor =
      opp.difficulty === 'easy' ? 'text-green-600' :
      opp.difficulty === 'medium' ? 'text-yellow-600' : 'text-red-600'

    const typeIcon = opp.type === 'content' ? Target : opp.type === 'messaging' ? Zap : AlertTriangle

    return (
      <Card key={`${opp.type}-${opp.title}`} className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {React.createElement(typeIcon, { className: "h-5 w-5 text-primary" })}
                <Badge variant="outline">{opp.type}</Badge>
                <Badge className={difficultyColor}>{opp.difficulty}</Badge>
              </div>
              <CardTitle className="text-lg">{opp.title}</CardTitle>
              <CardDescription className="mt-2">{opp.description}</CardDescription>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">{opp.roiScore}</div>
              <div className="text-xs text-muted-foreground">ROI Score</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Estimated Impact */}
            {opp.estimatedImpact.traffic && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Est. Traffic:</span>
                <span className="font-medium">{opp.estimatedImpact.traffic.toLocaleString()}/mo</span>
              </div>
            )}

            {/* Actionable */}
            <Alert>
              <AlertDescription className="text-sm">
                <strong>Action:</strong> {opp.actionable}
              </AlertDescription>
            </Alert>

            {/* Generate Content Button */}
            {onGenerateContent && opp.type === 'content' && (
              <Button
                onClick={() => onGenerateContent(opp)}
                className="w-full"
                variant="outline"
              >
                <Zap className="mr-2 h-4 w-4" />
                Generate Content for This Opportunity
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Competitive Intelligence</h2>
        <p className="text-muted-foreground">
          Analyze competitors, find gaps, and discover content opportunities
        </p>
      </div>

      {/* Input Form */}
      {step === 'input' && (
        <Card>
          <CardHeader>
            <CardTitle>Analyze Your Competition</CardTitle>
            <CardDescription>
              Powered by 16+ intelligence sources: Serper, SEMrush, Apify, Claude AI, and more
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Your Domain</label>
                <Input
                  type="text"
                  placeholder="example.com"
                  value={ourDomain}
                  onChange={(e) => setOurDomain(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Industry</label>
                <IndustrySelector
                  value={industry}
                  onChange={setIndustry}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Location (Optional)</label>
              <Input
                type="text"
                placeholder="New York, NY"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleAnalyze}
              disabled={!industry || !ourDomain}
              className="w-full"
              size="lg"
            >
              <Search className="mr-2 h-4 w-4" />
              Run Competitive Analysis
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading States */}
      {(step === 'discovering' || step === 'profiling' || step === 'analyzing') && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div className="text-center w-full max-w-md">
                <p className="text-lg font-medium mb-2">{statusMessage}</p>
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-muted-foreground mt-2">{Math.round(progress)}% complete</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {step === 'results' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold">{competitors.length}</div>
                  <div className="text-sm text-muted-foreground">Competitors Found</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold">
                    {opportunities.filter(o => o.type === 'content').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Content Gaps</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold">
                    {opportunities.filter(o => o.type === 'messaging').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Messaging Gaps</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold">
                    {opportunities.filter(o => o.roiScore >= 70).length}
                  </div>
                  <div className="text-sm text-muted-foreground">High-ROI Opportunities</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Opportunities Tabs */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All ({opportunities.length})</TabsTrigger>
              <TabsTrigger value="content">
                Content ({opportunities.filter(o => o.type === 'content').length})
              </TabsTrigger>
              <TabsTrigger value="messaging">
                Messaging ({opportunities.filter(o => o.type === 'messaging').length})
              </TabsTrigger>
              <TabsTrigger value="performance">
                Performance ({opportunities.filter(o => o.type === 'performance').length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4 mt-6">
              {opportunities.slice(0, 20).map(renderOpportunity)}
            </TabsContent>

            <TabsContent value="content" className="space-y-4 mt-6">
              {opportunities.filter(o => o.type === 'content').slice(0, 20).map(renderOpportunity)}
            </TabsContent>

            <TabsContent value="messaging" className="space-y-4 mt-6">
              {opportunities.filter(o => o.type === 'messaging').slice(0, 20).map(renderOpportunity)}
            </TabsContent>

            <TabsContent value="performance" className="space-y-4 mt-6">
              {opportunities.filter(o => o.type === 'performance').slice(0, 20).map(renderOpportunity)}
            </TabsContent>
          </Tabs>

          {/* Run New Analysis Button */}
          <div className="flex justify-center">
            <Button
              onClick={() => {
                setStep('input')
                setOpportunities([])
                setCompetitors([])
                setProgress(0)
              }}
              variant="outline"
            >
              <Search className="mr-2 h-4 w-4" />
              Run New Analysis
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
