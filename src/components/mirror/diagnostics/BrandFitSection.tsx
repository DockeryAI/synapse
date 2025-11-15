/**
 * Brand Fit Section
 * Deep dive into messaging consistency and brand clarity
 */

import React from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { AlertCircle, MessageSquare, Star, CheckCircle, XCircle, Info, Database, Target } from 'lucide-react'
import { type BrandFitData } from '@/types/mirror-diagnostics'

interface BrandFitSectionProps {
  data: BrandFitData
  hasCompletedUVP: boolean
  score: number // Added to show score calculation
}

export const BrandFitSection: React.FC<BrandFitSectionProps> = ({ data, hasCompletedUVP, score }) => {
  const isHighConsistency = data.messaging_consistency >= 80
  const isMediumConsistency =
    data.messaging_consistency >= 60 && data.messaging_consistency < 80
  const isLowConsistency = data.messaging_consistency < 60

  const isStrongDifferentiation = data.differentiation_score >= 70
  const isWeakDifferentiation = data.differentiation_score < 50

  // Calculate scoring breakdown for transparency
  const messagingPenalty = data.messaging_consistency < 50 ? 30 : data.messaging_consistency < 70 ? 15 : 0
  const differentiationPenalty = data.differentiation_score < 40 ? 25 : data.differentiation_score < 60 ? 10 : 0
  const clarityIssuesPenalty = data.clarity_issues.length * 5
  const reviewsPenalty = data.trust_signals.reviews_count < 10 ? 15 : data.trust_signals.reviews_count < 50 ? 5 : 0
  const ratingPenalty = data.trust_signals.average_rating < 3.5 ? 10 : data.trust_signals.average_rating < 4.0 ? 5 : 0
  const calculatedScore = Math.max(0, Math.min(100, 100 - messagingPenalty - differentiationPenalty - clarityIssuesPenalty - reviewsPenalty - ratingPenalty))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Brand Clarity & Fit</h2>
        <p className="text-muted-foreground mt-1">
          {hasCompletedUVP
            ? 'How consistently your UVP is communicated across all touchpoints'
            : 'What you say vs what customers hear'}
        </p>
      </div>

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
                  Brand Clarity Score starts at 100 and deducts points for consistency and trust issues:
                </p>
                <div className="font-mono text-xs bg-white p-2 rounded border">
                  Score = 100 - Messaging - Differentiation - Issues - Reviews - Rating
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

                {/* Messaging Consistency Penalty */}
                <div className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">Messaging Consistency</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Consistency: {data.messaging_consistency}%
                      {data.messaging_consistency < 50 && ' (Very inconsistent - penalty: -30 points)'}
                      {data.messaging_consistency >= 50 && data.messaging_consistency < 70 && ' (Somewhat inconsistent - penalty: -15 points)'}
                      {data.messaging_consistency >= 70 && ' (Good consistency - no penalty)'}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Database className="h-3 w-3" />
                      Source: Perplexity touchpoint analysis + OpenRouter AI comparison
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${messagingPenalty > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {messagingPenalty > 0 ? '-' : ''}{messagingPenalty}
                    </div>
                  </div>
                </div>

                {/* Differentiation Penalty */}
                <div className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">Differentiation Strength</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Score: {data.differentiation_score}%
                      {data.differentiation_score < 40 && ' (Generic messaging - penalty: -25 points)'}
                      {data.differentiation_score >= 40 && data.differentiation_score < 60 && ' (Weak uniqueness - penalty: -10 points)'}
                      {data.differentiation_score >= 60 && ' (Clear differentiation - no penalty)'}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Database className="h-3 w-3" />
                      Source: OpenRouter AI analysis of competitive positioning
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${differentiationPenalty > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {differentiationPenalty > 0 ? '-' : ''}{differentiationPenalty}
                    </div>
                  </div>
                </div>

                {/* Clarity Issues Penalty */}
                <div className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">Clarity Issues</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {data.clarity_issues.length} issues found (-5 points each)
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Database className="h-3 w-3" />
                      Source: OpenRouter AI touchpoint analysis
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${clarityIssuesPenalty > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {clarityIssuesPenalty > 0 ? '-' : ''}{clarityIssuesPenalty}
                    </div>
                  </div>
                </div>

                {/* Reviews Count Penalty */}
                <div className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">Reviews Volume</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {data.trust_signals.reviews_count} reviews
                      {data.trust_signals.reviews_count < 10 && ' (Very few - penalty: -15 points)'}
                      {data.trust_signals.reviews_count >= 10 && data.trust_signals.reviews_count < 50 && ' (Limited social proof - penalty: -5 points)'}
                      {data.trust_signals.reviews_count >= 50 && ' (Good volume - no penalty)'}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Database className="h-3 w-3" />
                      Source: Perplexity review aggregation
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${reviewsPenalty > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {reviewsPenalty > 0 ? '-' : ''}{reviewsPenalty}
                    </div>
                  </div>
                </div>

                {/* Rating Penalty */}
                <div className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">Average Rating</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {data.trust_signals.average_rating} stars
                      {data.trust_signals.average_rating < 3.5 && ' (Poor rating - penalty: -10 points)'}
                      {data.trust_signals.average_rating >= 3.5 && data.trust_signals.average_rating < 4.0 && ' (Below average - penalty: -5 points)'}
                      {data.trust_signals.average_rating >= 4.0 && ' (Good rating - no penalty)'}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Database className="h-3 w-3" />
                      Source: Perplexity review aggregation
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${ratingPenalty > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {ratingPenalty > 0 ? '-' : ''}{ratingPenalty}
                    </div>
                  </div>
                </div>

                {/* Final Score */}
                <div className="flex items-start justify-between p-3 border-2 border-primary rounded-lg bg-primary/5">
                  <div className="flex-1">
                    <div className="font-bold text-base">Final Brand Clarity Score</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      100 - {messagingPenalty} - {differentiationPenalty} - {clarityIssuesPenalty} - {reviewsPenalty} - {ratingPenalty} = {calculatedScore}
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
                    <Badge variant="secondary" className="text-xs">Perplexity</Badge>
                    <span>Website, Google Business, social media, and review analysis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">OpenRouter (Claude)</Badge>
                    <span>AI comparison of messaging consistency and differentiation</span>
                  </div>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Overall Messaging Consistency */}
      <Card>
        <CardHeader>
          <CardTitle>Messaging Consistency Score</CardTitle>
          <CardDescription>
            How aligned your message is across all customer touchpoints
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center p-6 border rounded-lg">
            <div className="text-sm text-muted-foreground mb-2">Overall Consistency</div>
            <div
              className={`text-5xl font-bold mb-2 ${
                isHighConsistency
                  ? 'text-green-600'
                  : isMediumConsistency
                    ? 'text-yellow-600'
                    : 'text-red-600'
              }`}
            >
              {data.messaging_consistency}%
            </div>
            <Progress value={data.messaging_consistency} className="max-w-xs mx-auto" />
            <p className="text-sm text-muted-foreground mt-3">
              {isHighConsistency && 'Excellent - consistent message across all touchpoints'}
              {isMediumConsistency && 'Moderate - some inconsistencies detected'}
              {isLowConsistency && 'Poor - confusing mixed messages across touchpoints'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Touchpoint Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>What You Say in Each Place</CardTitle>
          <CardDescription>Your message across different customer touchpoints</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Website */}
            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Website</Badge>
                  {data.touchpoint_analysis.website.alignment >= 70 ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Alignment</span>
                  <span className="font-bold">{data.touchpoint_analysis.website.alignment}%</span>
                </div>
              </div>
              <p className="text-sm">{data.touchpoint_analysis.website.message}</p>
              <Progress value={data.touchpoint_analysis.website.alignment} className="h-2" />
            </div>

            {/* Google Business */}
            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Google Business</Badge>
                  {data.touchpoint_analysis.google.alignment >= 70 ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Alignment</span>
                  <span className="font-bold">{data.touchpoint_analysis.google.alignment}%</span>
                </div>
              </div>
              <p className="text-sm">{data.touchpoint_analysis.google.message}</p>
              <Progress value={data.touchpoint_analysis.google.alignment} className="h-2" />
            </div>

            {/* Social Media */}
            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Social Media</Badge>
                  {data.touchpoint_analysis.social.alignment >= 70 ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Alignment</span>
                  <span className="font-bold">{data.touchpoint_analysis.social.alignment}%</span>
                </div>
              </div>
              <p className="text-sm">{data.touchpoint_analysis.social.message}</p>
              <Progress value={data.touchpoint_analysis.social.alignment} className="h-2" />
            </div>

            {/* Customer Reviews (What they hear) */}
            <div className="border-2 border-blue-200 rounded-lg p-4 space-y-2 bg-blue-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="default">Customer Reviews (Reality)</Badge>
                  {data.touchpoint_analysis.reviews.alignment >= 70 ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Alignment</span>
                  <span className="font-bold">{data.touchpoint_analysis.reviews.alignment}%</span>
                </div>
              </div>
              <p className="text-sm">{data.touchpoint_analysis.reviews.message}</p>
              <Progress value={data.touchpoint_analysis.reviews.alignment} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Perception */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            What Customers Actually Think You Do
          </CardTitle>
          <CardDescription>Based on reviews and customer feedback</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-medium">{data.perceived_positioning}</p>
          {data.touchpoint_analysis.reviews.alignment < 70 && (
            <div className="mt-4 p-3 bg-white border border-blue-300 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <span className="font-semibold">Perception Gap: </span>
                  What customers perceive differs from what you're trying to communicate. This
                  confusion costs you business.
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Differentiation Score */}
      <Card>
        <CardHeader>
          <CardTitle>Differentiation Strength</CardTitle>
          <CardDescription>How unique and memorable your positioning is</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Differentiation Score</div>
              <div
                className={`text-3xl font-bold ${
                  isStrongDifferentiation
                    ? 'text-green-600'
                    : isWeakDifferentiation
                      ? 'text-red-600'
                      : 'text-yellow-600'
                }`}
              >
                {data.differentiation_score}%
              </div>
            </div>
            <Progress value={data.differentiation_score} className="w-48" />
          </div>

          <div className="text-sm">
            {isStrongDifferentiation && (
              <p className="text-green-700 bg-green-50 p-3 rounded-lg">
                ✓ You have a clear, unique position that sets you apart from competitors
              </p>
            )}
            {isWeakDifferentiation && (
              <p className="text-red-700 bg-red-50 p-3 rounded-lg">
                ✗ You sound like everyone else in your market - no clear differentiation
              </p>
            )}
            {!isStrongDifferentiation && !isWeakDifferentiation && (
              <p className="text-yellow-700 bg-yellow-50 p-3 rounded-lg">
                ⚠ Some differentiation exists but it's not strong or clear enough
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Trust Signals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Trust Signals
          </CardTitle>
          <CardDescription>Social proof and credibility indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg text-center">
              <div className="text-3xl font-bold text-primary">
                {data.trust_signals.reviews_count}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Reviews</div>
            </div>

            <div className="p-4 border rounded-lg text-center">
              <div className="text-3xl font-bold text-primary flex items-center justify-center gap-1">
                {data.trust_signals.average_rating}
                <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
              </div>
              <div className="text-sm text-muted-foreground mt-1">Average Rating</div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="text-sm font-medium text-muted-foreground mb-2">Social Proof</div>
              <div className="space-y-1">
                {data.trust_signals.social_proof.length > 0 ? (
                  data.trust_signals.social_proof.map((proof, index) => (
                    <Badge key={index} variant="secondary" className="mr-1">
                      {proof}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">None found</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clarity Issues */}
      {data.clarity_issues.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Clarity Issues to Fix
            </CardTitle>
            <CardDescription>Problems making your brand message confusing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.clarity_issues.map((issue, index) => (
                <div key={index} className="border rounded-lg p-4 bg-white space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{issue.touchpoint}</Badge>
                    <span className="font-semibold">{issue.issue}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Fix: </span>
                    {issue.fix}
                  </p>
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
              <CheckCircle className="h-5 w-5 text-blue-600" />
              UVP Consistency Check
            </CardTitle>
            <CardDescription>
              How well your UVP is being communicated across all touchpoints
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>UVP messaging analysis coming soon</p>
              <p className="text-sm mt-2">
                We'll verify your UVP is consistently communicated across all customer touchpoints
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
