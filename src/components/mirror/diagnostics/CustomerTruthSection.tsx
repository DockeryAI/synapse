/**
 * Customer Truth Section
 * Deep dive into who actually buys and why
 */

import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { AlertCircle, Users, DollarSign, TrendingUp, Info, Database, Target, Lock, ArrowRight } from 'lucide-react'
import { type CustomerTruthData } from '@/types/mirror-diagnostics'

interface CustomerTruthSectionProps {
  data: CustomerTruthData
  hasCompletedUVP: boolean
  hasBuyerJourney?: boolean
  brandId?: string
  score: number // Added to show score calculation
}

export const CustomerTruthSection: React.FC<CustomerTruthSectionProps> = ({
  data,
  hasCompletedUVP,
  hasBuyerJourney = false,
  brandId,
  score,
}) => {
  const navigate = useNavigate()
  const isGoodMatch = data.match_percentage >= 70
  const isModerateMatch = data.match_percentage >= 50 && data.match_percentage < 70
  const isPoorMatch = data.match_percentage < 50

  // Calculate scoring breakdown for transparency
  const demographicPenalty = data.match_percentage < 50 ? 30 : data.match_percentage < 70 ? 15 : 0
  const pricePenalty = data.price_vs_value_perception.includes('cheapest') ? 20 : 0
  const journeyGapsPenalty = data.buyer_journey_gaps.length * 5
  const calculatedScore = Math.max(0, Math.min(100, 100 - demographicPenalty - pricePenalty - journeyGapsPenalty))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Customer Truth Assessment</h2>
        <p className="text-muted-foreground mt-1">
          {hasCompletedUVP
            ? 'How well your actual customers align with your UVP'
            : 'The reality of who buys from you and why'}
        </p>
      </div>

      {/* UVP Creation Banner - Shows FIRST if UVP not completed */}
      {!hasCompletedUVP && brandId && (
        <Card className="border-purple-200 bg-purple-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-purple-100">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Create Your Unique Value Proposition First</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Before defining your buyer journey, create your UVP to establish who you serve,
                  what problem you solve, and why customers should choose you over competitors.
                </p>
                <Button
                  onClick={() => {
                    // Scroll to roadmap section where UVP wizard is located
                    const roadmapSection = document.getElementById('roadmap')
                    if (roadmapSection) {
                      roadmapSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }
                  }}
                  className="gap-2 bg-purple-600 hover:bg-purple-700"
                >
                  Create UVP
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Buyer Journey Lock Banner - Shows SECOND if both UVP exists but buyer journey doesn't */}
      {hasCompletedUVP && !hasBuyerJourney && brandId && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-blue-100">
                <Lock className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Map Your Customer Journey</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Now that you have your UVP, use our visual 4-step wizard to map how customers
                  discover, research, and buy from you. Takes just 8-12 minutes.
                </p>
                <Button
                  onClick={() => navigate('/buyer-journey-simple')}
                  className="gap-2"
                >
                  Start Journey Wizard
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ICP Source Badge */}
      {hasBuyerJourney && (
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="default" className="bg-green-600">ICP Defined</Badge>
              <span className="text-muted-foreground">
                Demographics shown below are from your defined Ideal Customer Profile
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Score Calculation Breakdown */}
      <Accordion type="single" collapsible className="border rounded-lg">
        <AccordionItem value="score-calc" className="border-none">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-600" />
              <span className="font-semibold text-sm">How This Score Was Calculated</span>
              <Badge variant="outline" className="ml-2">{score}/100</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4 text-sm">
              {/* Formula Explanation */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="font-semibold mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  Scoring Formula
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  Customer Match Score starts at 100 and deducts points for misalignment:
                </p>
                <div className="font-mono text-xs bg-white p-2 rounded border">
                  Score = 100 - Demographic Penalty - Price Penalty - Journey Gaps Penalty
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="space-y-3">
                <div className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">Starting Score</div>
                    <div className="text-xs text-muted-foreground mt-1">Base score before penalties</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">100</div>
                  </div>
                </div>

                {/* Demographic Mismatch Penalty */}
                <div className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">Demographic Match</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Match: {data.match_percentage}%
                      {data.match_percentage < 50 && ' (Poor alignment - penalty: -30 points)'}
                      {data.match_percentage >= 50 && data.match_percentage < 70 && ' (Partial alignment - penalty: -15 points)'}
                      {data.match_percentage >= 70 && ' (Good alignment - no penalty)'}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Database className="h-3 w-3" />
                      Source: Google Analytics demographics + brand target definition
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${demographicPenalty > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {demographicPenalty > 0 ? '-' : ''}{demographicPenalty}
                    </div>
                  </div>
                </div>

                {/* Price Competition Penalty */}
                <div className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">Price vs Value Positioning</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {data.price_vs_value_perception}
                      {pricePenalty > 0 && ' (Competing on price - penalty: -20 points)'}
                      {pricePenalty === 0 && ' (Value-based - no penalty)'}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Database className="h-3 w-3" />
                      Source: Perplexity review mining + OpenRouter AI analysis
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${pricePenalty > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {pricePenalty > 0 ? '-' : ''}{pricePenalty}
                    </div>
                  </div>
                </div>

                {/* Journey Gaps Penalty */}
                <div className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">Buyer Journey Gaps</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {data.buyer_journey_gaps.length} drop-off points identified (-5 points each)
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Database className="h-3 w-3" />
                      Source: OpenRouter AI analysis of customer feedback
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${journeyGapsPenalty > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {journeyGapsPenalty > 0 ? '-' : ''}{journeyGapsPenalty}
                    </div>
                  </div>
                </div>

                {/* Final Score */}
                <div className="flex items-start justify-between p-3 border-2 border-primary rounded-lg bg-primary/5">
                  <div className="flex-1">
                    <div className="font-bold text-base">Final Customer Match Score</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      100 - {demographicPenalty} - {pricePenalty} - {journeyGapsPenalty} = {calculatedScore}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{score}</div>
                  </div>
                </div>
              </div>

              {/* Data Sources Summary */}
              <div className="p-3 bg-gray-50 border rounded-lg">
                <div className="font-semibold mb-2 text-xs">Data Sources Used</div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">Google Analytics</Badge>
                    <span>Actual customer demographics and behavior</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">Perplexity</Badge>
                    <span>Customer review mining and sentiment analysis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">OpenRouter (Claude)</Badge>
                    <span>AI analysis of buying patterns and objections</span>
                  </div>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Expected vs Actual Demographics */}
      <Card>
        <CardHeader>
          <CardTitle>Who You Think Buys vs Who Actually Buys</CardTitle>
          <CardDescription>
            Alignment between your target audience and actual customers
          </CardDescription>
          {/* Note about inferred data */}
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
            <strong>Note:</strong> Demographics shown are inferred from location and industry data. Connect Google Analytics for precise customer demographics.
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Match Score */}
          <div className="text-center p-6 border rounded-lg">
            <div className="text-sm text-muted-foreground mb-2">Demographic Match</div>
            <div
              className={`text-5xl font-bold mb-2 ${
                isGoodMatch
                  ? 'text-green-600'
                  : isModerateMatch
                    ? 'text-yellow-600'
                    : 'text-red-600'
              }`}
            >
              {data.match_percentage}%
            </div>
            <Progress value={data.match_percentage} className="max-w-xs mx-auto" />
            <p className="text-sm text-muted-foreground mt-3">
              {isGoodMatch && 'Great alignment - you know your customers well'}
              {isModerateMatch && 'Partial alignment - some surprises in who actually buys'}
              {isPoorMatch && 'Misalignment detected - reality differs from expectations'}
            </p>
          </div>

          {/* Comparison Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="font-semibold text-center">Expected Customers</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-muted-foreground">Age Range</div>
                  <div className="font-medium">{data.expected_demographic.age}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Income Level</div>
                  <div className="font-medium">{data.expected_demographic.income}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Location</div>
                  <div className="font-medium">{data.expected_demographic.location}</div>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4 space-y-4 bg-blue-50/50">
              <h3 className="font-semibold text-center">Actual Customers</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-muted-foreground">Age Range</div>
                  <div className="font-medium">{data.actual_demographic.age}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Income Level</div>
                  <div className="font-medium">{data.actual_demographic.income}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Location</div>
                  <div className="font-medium">{data.actual_demographic.location}</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Why They Choose You */}
      <Card>
        <CardHeader>
          <CardTitle>Why Customers Actually Choose You</CardTitle>
          <CardDescription>
            Real reasons from reviews and customer feedback (not assumptions)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.why_they_choose.map((reason, index) => (
              <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{reason.reason}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Source: {reason.source}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">{reason.percentage}%</div>
                  <Progress value={reason.percentage} className="w-24 h-2 mt-1" />
                </div>
              </div>
            ))}
          </div>

          {data.why_they_choose.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              No customer choice data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Price vs Value Perception */}
      <Card
        className={
          data.price_vs_value_perception.includes('cheapest')
            ? 'border-yellow-200 bg-yellow-50/50'
            : 'border-green-200 bg-green-50/50'
        }
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Price vs Value Perception
          </CardTitle>
          <CardDescription>How customers view your pricing</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-lg">{data.price_vs_value_perception}</p>
          {data.price_vs_value_perception.includes('cheapest') && (
            <div className="mt-4 p-3 bg-white border border-yellow-300 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <span className="font-semibold">Warning: </span>
                  Competing on price attracts customers who will leave for cheaper alternatives.
                  Consider building value-based differentiation instead.
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Common Objections */}
      {data.common_objections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Common Customer Objections</CardTitle>
            <CardDescription>What holds people back from buying or returning</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.common_objections.map((objection, index) => (
                <li key={index} className="flex items-start gap-2 p-3 border rounded-lg">
                  <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                  <span>{objection}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Buyer Journey Gaps */}
      {data.buyer_journey_gaps.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader>
            <CardTitle>Buyer Journey Drop-Off Points</CardTitle>
            <CardDescription>Where you're losing potential customers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.buyer_journey_gaps.map((gap, index) => (
                <div key={index} className="border rounded-lg p-4 bg-white space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {gap.stage}
                    </Badge>
                    <span className="font-semibold">{gap.gap}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{gap.impact}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Post-UVP Enhancement */}
      {hasCompletedUVP && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              UVP Customer Alignment
            </CardTitle>
            <CardDescription>
              How well your customers validate your unique value proposition
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Customer confirmation analysis coming soon</p>
              <p className="text-sm mt-2">
                We'll show what percentage of customers confirm your UVP promise in reviews
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
