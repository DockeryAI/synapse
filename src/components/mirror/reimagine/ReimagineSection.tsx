import * as React from 'react'
import { BrandStrategy } from './BrandStrategy'
import { AudienceStrategy } from './AudienceStrategy'
import { ContentStrategy } from './ContentStrategy'
import { CompetitiveStrategy } from './CompetitiveStrategy'
import { ArchetypeVoiceAlignment } from './ArchetypeVoiceAlignment'
import { BrandStoryBuilder } from './BrandStoryBuilder'
import { CustomerAnalysisTab } from './CustomerAnalysisTab'
import { ProductAnalysisTab } from './ProductAnalysisTab'
import { CompetitorOpportunitiesTab } from './CompetitorOpportunitiesTab'
import { SWOTAnalysisTab } from './SWOTAnalysisTab'
import { UVPFlowSection } from '@/components/mirror/value/UVPFlowSection'
import { MirrorSectionHeader } from '@/components/layouts/MirrorLayout'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { StrategyBuilder, MarketingStrategy } from '@/services/mirror/strategy-builder'
import { supabase } from '@/lib/supabase'
import { Sparkles, Target, Users, FileText, Swords, UserCircle, Package, Zap, LayoutGrid, Lightbulb } from 'lucide-react'

interface ReimagineSectionProps {
  brandId: string
  brandData: any
  objectives: any[]
  situationAnalysis: any
  competitors: any[]
  className?: string
}

export const ReimagineSection: React.FC<ReimagineSectionProps> = ({
  brandId,
  brandData,
  objectives,
  situationAnalysis,
  competitors,
  className,
}) => {
  const [strategy, setStrategy] = React.useState<Partial<MarketingStrategy>>({})
  const [personas, setPersonas] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState('uvp')
  const [hasCompletedUVP, setHasCompletedUVP] = React.useState(false)

  // Check if UVP is completed
  React.useEffect(() => {
    const checkUVPCompletion = async () => {
      if (!brandId) return

      // Check brand_uvps table for completion status
      const { data: uvpData, error: uvpError } = await supabase
        .from('brand_uvps')
        .select('id, is_complete, current_step')
        .eq('brand_id', brandId)
        .maybeSingle()

      // Also check value_statements table as fallback
      const { data: valueData, error: valueError } = await supabase
        .from('value_statements')
        .select('id, is_primary')
        .eq('brand_id', brandId)
        .eq('is_primary', true)
        .maybeSingle()

      // UVP is complete if either table has completed data
      const isComplete =
        (!uvpError && uvpData?.is_complete === true) ||
        (!uvpError && uvpData?.current_step === 'complete') ||
        (!valueError && !!valueData)

      setHasCompletedUVP(isComplete)
    }

    checkUVPCompletion()
  }, [brandId])

  React.useEffect(() => {
    loadStrategy()
  }, [brandId])

  React.useEffect(() => {
    if (brandData && objectives.length > 0 && Object.keys(strategy).length === 0) {
      generateFullStrategy()
    }
  }, [brandData, objectives])

  const loadStrategy = async () => {
    setIsLoading(true)
    try {
      // Load saved strategy from database
      const { data, error } = await supabase
        .from('marketing_strategies')
        .select('*')
        .eq('brand_id', brandId)
        .maybeSingle()

      if (!error && data) {
        setStrategy(data.strategy_data)
        if (data.strategy_data.audience_strategy?.primary_personas) {
          setPersonas(data.strategy_data.audience_strategy.primary_personas)
        }
      }
    } catch (error) {
      // Table may not exist yet - silently handle
      console.log('Marketing strategies table not found - will generate from industry data')
    } finally {
      setIsLoading(false)
    }
  }

  const generateFullStrategy = async () => {
    setIsLoading(true)
    try {
      const fullStrategy = StrategyBuilder.generateStrategy({
        brandData,
        objectives,
        situationAnalysis,
        competitors,
      })

      setStrategy(fullStrategy)
      if (fullStrategy.audience_strategy?.primary_personas) {
        setPersonas(fullStrategy.audience_strategy.primary_personas)
      }
    } catch (error) {
      console.error('Failed to generate strategy:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveBrandStrategy = async (brandStrategyData: any) => {
    try {
      const updatedStrategy = {
        ...strategy,
        brand_strategy: {
          ...strategy.brand_strategy,
          ...brandStrategyData,
        },
      }

      const { error } = await supabase
        .from('marketing_strategies')
        .upsert({
          brand_id: brandId,
          strategy_data: updatedStrategy,
          updated_at: new Date().toISOString(),
        })

      if (!error) {
        setStrategy(updatedStrategy)
      }
    } catch (error) {
      console.error('Failed to save brand strategy:', error)
    }
  }

  const handleSaveAudienceStrategy = async (audienceStrategyData: any) => {
    try {
      const updatedStrategy = {
        ...strategy,
        audience_strategy: {
          ...strategy.audience_strategy,
          ...audienceStrategyData,
        },
      }

      const { error } = await supabase
        .from('marketing_strategies')
        .upsert({
          brand_id: brandId,
          strategy_data: updatedStrategy,
          updated_at: new Date().toISOString(),
        })

      if (!error) {
        setStrategy(updatedStrategy)
      }
    } catch (error) {
      console.error('Failed to save audience strategy:', error)
    }
  }

  const handleSaveContentStrategy = async (contentStrategyData: any) => {
    try {
      const updatedStrategy = {
        ...strategy,
        content_strategy: {
          ...strategy.content_strategy,
          ...contentStrategyData,
        },
      }

      const { error } = await supabase
        .from('marketing_strategies')
        .upsert({
          brand_id: brandId,
          strategy_data: updatedStrategy,
          updated_at: new Date().toISOString(),
        })

      if (!error) {
        setStrategy(updatedStrategy)
      }
    } catch (error) {
      console.error('Failed to save content strategy:', error)
    }
  }

  const handleSaveCompetitiveStrategy = async (competitiveStrategyData: any) => {
    try {
      const updatedStrategy = {
        ...strategy,
        competitive_strategy: {
          ...strategy.competitive_strategy,
          ...competitiveStrategyData,
        },
      }

      const { error } = await supabase
        .from('marketing_strategies')
        .upsert({
          brand_id: brandId,
          strategy_data: updatedStrategy,
          updated_at: new Date().toISOString(),
        })

      if (!error) {
        setStrategy(updatedStrategy)
      }
    } catch (error) {
      console.error('Failed to save competitive strategy:', error)
    }
  }

  return (
    <div className={className}>
      <MirrorSectionHeader
        title="Roadmap"
        description="Plan how to get there — the channels, audience, and strategy"
        badge={<span className="text-xs">MARBA Analysis | Strategy</span>}
        actions={
          <Button size="sm" onClick={generateFullStrategy} disabled={isLoading}>
            <Sparkles className="h-4 w-4 mr-2" />
            {isLoading ? 'Generating...' : 'Regenerate All'}
          </Button>
        }
      />

      <div className="container py-6 px-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full ${hasCompletedUVP ? 'grid-cols-9' : 'grid-cols-5'}`}>
            <TabsTrigger value="uvp" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              <span className="hidden sm:inline">UVP</span>
              {!hasCompletedUVP && (
                <Badge variant="default" className="ml-1 text-xs bg-blue-600">
                  Start
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="brand" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Brand</span>
            </TabsTrigger>
            <TabsTrigger value="audience" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Audience</span>
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Content</span>
            </TabsTrigger>
            <TabsTrigger value="competitive" className="flex items-center gap-2">
              <Swords className="h-4 w-4" />
              <span className="hidden sm:inline">Competitive</span>
            </TabsTrigger>
            {hasCompletedUVP && (
              <>
                <TabsTrigger value="customers" className="flex items-center gap-2">
                  <UserCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Customers</span>
                </TabsTrigger>
                <TabsTrigger value="product" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  <span className="hidden sm:inline">Product</span>
                </TabsTrigger>
                <TabsTrigger value="opportunities" className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  <span className="hidden sm:inline">Opportunities</span>
                </TabsTrigger>
                <TabsTrigger value="swot" className="flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4" />
                  <span className="hidden sm:inline">SWOT</span>
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="uvp" className="mt-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg p-6 mb-6 border-2 border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-blue-600 p-3 animate-pulse">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    {hasCompletedUVP ? 'Your Value Proposition' : 'Start Here: Define Your Value Proposition'}
                    {!hasCompletedUVP && (
                      <Badge variant="default" className="bg-blue-600">
                        Required
                      </Badge>
                    )}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {hasCompletedUVP
                      ? 'Review and refine your Unique Value Proposition. This is the foundation of your entire marketing strategy.'
                      : 'Your Unique Value Proposition (UVP) is the foundation of your entire marketing strategy. It tells customers why they should choose you over competitors. Complete this first - it only takes 5 minutes - then advanced insights will unlock.'}
                  </p>
                </div>
              </div>
            </div>
            <UVPFlowSection brandId={brandId} brandData={brandData} />
          </TabsContent>

          <TabsContent value="brand" className="mt-6">
            <BrandStrategy
              brandData={brandData}
              objectives={objectives}
              onSave={handleSaveBrandStrategy}
            />
          </TabsContent>

          <TabsContent value="audience" className="mt-6">
            <AudienceStrategy
              brandData={brandData}
              objectives={objectives}
              situationAnalysis={situationAnalysis}
              onSave={handleSaveAudienceStrategy}
            />
          </TabsContent>

          <TabsContent value="content" className="mt-6">
            <ContentStrategy
              personas={personas}
              objectives={objectives}
              onSave={handleSaveContentStrategy}
            />
          </TabsContent>

          <TabsContent value="competitive" className="mt-6">
            <CompetitiveStrategy
              brandData={brandData}
              competitors={competitors}
              industry={brandData.industry || 'Technology'}
              onSave={handleSaveCompetitiveStrategy}
            />
          </TabsContent>

          {/* Post-UVP Analysis Tabs */}
          {hasCompletedUVP && (
            <>
              <TabsContent value="customers" className="mt-6">
                <CustomerAnalysisTab brandId={brandId} brandData={brandData} />
              </TabsContent>

              <TabsContent value="product" className="mt-6">
                <ProductAnalysisTab brandId={brandId} brandData={brandData} />
              </TabsContent>

              <TabsContent value="opportunities" className="mt-6">
                <CompetitorOpportunitiesTab brandId={brandId} brandData={brandData} />
              </TabsContent>

              <TabsContent value="swot" className="mt-6">
                <SWOTAnalysisTab
                  brandId={brandId}
                  brandData={brandData}
                  hasCompletedUVP={hasCompletedUVP}
                />
              </TabsContent>
            </>
          )}
        </Tabs>

        {/* Brand Personality & Story - NEW */}
        <div className="mt-6 space-y-6">
          <ArchetypeVoiceAlignment brandData={brandData} />
          <BrandStoryBuilder brandData={brandData} />
        </div>
      </div>
    </div>
  )
}
