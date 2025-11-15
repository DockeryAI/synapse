/**
 * UVP Flow Section
 * Standalone MIRROR section for Value Proposition creation and management
 * Core to all content - positioned between Intend and Reimagine in MIRROR framework
 */

import * as React from 'react'
import { MirrorSectionHeader } from '@/components/layouts/MirrorLayout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UVPProvider, useUVP } from '@/contexts/UVPContext'
import { UVPWizardProvider } from '@/contexts/UVPWizardContext'
import { UVPWizard } from '@/components/uvp-wizard/UVPWizard'
import { WWHEnhancementFlow } from './WWHEnhancementFlow'
import {
  Sparkles,
  Lightbulb,
  FileText,
  TestTube,
  Layers,
  Library,
  Swords,
  Target,
} from 'lucide-react'

interface UVPFlowSectionProps {
  brandId: string
  brandData?: any
  className?: string
}

const UVPFlowSectionContent: React.FC<UVPFlowSectionProps> = ({
  brandId,
  brandData,
  className,
}) => {
  const {
    activeTab,
    setActiveTab,
    statements,
    isLoadingStatements,
    isGenerating,
    createStatement,
  } = useUVP()

  // Problem-Solution-Outcome state
  const [problem, setProblem] = React.useState('')
  const [solution, setSolution] = React.useState('')
  const [outcome, setOutcome] = React.useState('')

  const handleWWHFlowComplete = async (data: {
    problem: string
    solution: string
    outcome: string
    purpose: string
    approach: string[]
    offerings: string[]
    wwhData: any
  }) => {
    // Save the complete UVP with WWH enhancement data
    try {
      await createStatement({
        headline: `${data.solution}`,
        subheadline: data.purpose,
        supporting_points: data.offerings,
        call_to_action: 'Get Started',
        problem_statement: data.problem,
        solution_statement: data.solution,
        outcome_statement: data.outcome,
        purpose_statement: data.purpose,
        unique_approach: data.approach,
        core_offerings: data.offerings,
        context: 'website',
        status: 'active',
        is_primary: true, // This is the primary UVP
      })

      // Switch to library tab to see the new statement
      setActiveTab('library')
    } catch (error) {
      console.error('Failed to save WWH-enhanced UVP:', error)
    }
  }

  // Get primary UVP for badge display
  const primaryUVP = statements.find(s => s.is_primary)

  return (
    <div className={className}>
      <MirrorSectionHeader
        title="Value"
        description="Your Unique Value Proposition - the core message that drives all content"
        badge={
          <div className="flex items-center gap-2">
            <span className="text-xs">MIRROR Analysis</span>
            {primaryUVP && (
              <Badge variant="secondary" className="text-xs">
                Primary Set
              </Badge>
            )}
          </div>
        }
      />

      <div className="container py-6 px-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-card rounded-lg border p-4 text-center">
            <div className="text-2xl font-bold">{statements.length}</div>
            <div className="text-xs text-muted-foreground">Total UVPs</div>
          </div>
          <div className="bg-card rounded-lg border p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {statements.filter(s => s.status === 'active').length}
            </div>
            <div className="text-xs text-muted-foreground">Active</div>
          </div>
          <div className="bg-card rounded-lg border p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {statements.filter(s => s.status === 'testing').length}
            </div>
            <div className="text-xs text-muted-foreground">Testing</div>
          </div>
          <div className="bg-card rounded-lg border p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {primaryUVP ? Math.round(primaryUVP.clarity_score) : 0}
            </div>
            <div className="text-xs text-muted-foreground">Primary Clarity</div>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => {
          console.log('[UVPFlowSection] Tab changed to:', value)
          setActiveTab(value as any)
        }} className="w-full" defaultValue="builder">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="builder" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              <span className="hidden sm:inline">Builder</span>
            </TabsTrigger>
            <TabsTrigger value="formulas" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Formulas</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              <span className="hidden sm:inline">Templates</span>
            </TabsTrigger>
            <TabsTrigger value="variants" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Variants</span>
            </TabsTrigger>
            <TabsTrigger value="testing" className="flex items-center gap-2">
              <TestTube className="h-4 w-4" />
              <span className="hidden sm:inline">Testing</span>
            </TabsTrigger>
            <TabsTrigger value="competitive" className="flex items-center gap-2">
              <Swords className="h-4 w-4" />
              <span className="hidden sm:inline">Competitive</span>
            </TabsTrigger>
            <TabsTrigger value="library" className="flex items-center gap-2">
              <Library className="h-4 w-4" />
              <span className="hidden sm:inline">Library</span>
            </TabsTrigger>
          </TabsList>

          {/* Builder Tab - Main UVP Creation with Interactive Wizard */}
          <TabsContent value="builder" className="mt-6 space-y-6" data-uvp-section>
            <div className="min-h-[600px]">
              <UVPWizard
                brandName={brandData?.name}
                industry={brandData?.industry}
                // Don't auto-close wizard - let user view completion screen and visualizations
                onComplete={undefined}
              />
            </div>
          </TabsContent>          {/* Formulas Tab - Pre-built UVP Formulas */}
          <TabsContent value="formulas" className="mt-6 space-y-6">
            <div className="text-center py-12">
              <FileText className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="text-muted-foreground mb-2">UVP Formulas</p>
              <p className="text-sm text-muted-foreground">
                Choose from 5 proven UVP formulas and fill in the blanks
              </p>
            </div>
          </TabsContent>

          {/* Templates Tab - Industry Templates */}
          <TabsContent value="templates" className="mt-6 space-y-6">
            <div className="text-center py-12">
              <Layers className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="text-muted-foreground mb-2">Industry Templates</p>
              <p className="text-sm text-muted-foreground">
                Browse UVP templates specific to your industry
              </p>
            </div>
          </TabsContent>

          {/* Variants Tab - Manage Multiple UVPs */}
          <TabsContent value="variants" className="mt-6 space-y-6">
            <div className="text-center py-12">
              <Target className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="text-muted-foreground mb-2">UVP Variants</p>
              <p className="text-sm text-muted-foreground">
                Manage primary and alternate UVPs for different contexts
              </p>
            </div>
          </TabsContent>

          {/* Testing Tab - A/B Test Predictor */}
          <TabsContent value="testing" className="mt-6 space-y-6">
            <div className="text-center py-12">
              <TestTube className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="text-muted-foreground mb-2">A/B Test Predictor</p>
              <p className="text-sm text-muted-foreground">
                AI-powered performance predictions for your UVP variants
              </p>
            </div>
          </TabsContent>

          {/* Competitive Tab - Competitor Analysis */}
          <TabsContent value="competitive" className="mt-6 space-y-6">
            <div className="text-center py-12">
              <Swords className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="text-muted-foreground mb-2">Competitive Analysis</p>
              <p className="text-sm text-muted-foreground">
                Compare your UVP against competitors and find differentiation opportunities
              </p>
            </div>
          </TabsContent>

          {/* Library Tab - All UVPs */}
          <TabsContent value="library" className="mt-6 space-y-6">
            <div className="text-center py-12">
              <Library className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="text-muted-foreground mb-2">UVP Library</p>
              <p className="text-sm text-muted-foreground">
                View and manage all your value propositions
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Getting Started Guide - Show when no UVPs exist */}
        {statements.length === 0 && !isLoadingStatements && (
          <div className="mt-8 rounded-lg border bg-muted/50 p-6">
            <div className="max-w-2xl mx-auto text-center">
              <h3 className="text-lg font-semibold mb-2">Welcome to UVP Flow</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Your Unique Value Proposition is the foundation of all your content. It answers the question:
                "Why should customers choose you over competitors?"
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 text-left">
                <div className="bg-card p-4 rounded-lg border">
                  <div className="text-2xl mb-2">1️⃣</div>
                  <h4 className="font-semibold mb-1 text-sm">Choose Your Approach</h4>
                  <p className="text-xs text-muted-foreground">
                    Use a formula, template, or build from scratch
                  </p>
                </div>
                <div className="bg-card p-4 rounded-lg border">
                  <div className="text-2xl mb-2">2️⃣</div>
                  <h4 className="font-semibold mb-1 text-sm">Get AI Scoring</h4>
                  <p className="text-xs text-muted-foreground">
                    Real-time clarity and conversion potential scores
                  </p>
                </div>
                <div className="bg-card p-4 rounded-lg border">
                  <div className="text-2xl mb-2">3️⃣</div>
                  <h4 className="font-semibold mb-1 text-sm">Create Variants</h4>
                  <p className="text-xs text-muted-foreground">
                    Adapt your UVP for different channels and audiences
                  </p>
                </div>
              </div>
              <div className="mt-6 flex gap-3 justify-center">
                <Button onClick={() => setActiveTab('formulas')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Start with Formula
                </Button>
                <Button variant="outline" onClick={() => setActiveTab('templates')}>
                  <Layers className="h-4 w-4 mr-2" />
                  Browse Templates
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Wrapper component that provides UVP Context
export const UVPFlowSection: React.FC<UVPFlowSectionProps> = React.memo(({
  brandId,
  brandData,
  className,
}) => {
  console.log('[UVPFlowSection] Wrapper rendering with brandId:', brandId)

  return (
    <UVPProvider brandId={brandId}>
      <UVPWizardProvider brandId={brandId} brandData={brandData}>
        <UVPFlowSectionContent brandId={brandId} brandData={brandData} className={className} />
      </UVPWizardProvider>
    </UVPProvider>
  )
})
