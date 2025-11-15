/**
 * Brand Story Builder Component
 * Displays brand origin story, narrative arc, and transformation promise
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BookOpen, ArrowRight, Sparkles, FileText, Users } from 'lucide-react'

interface BrandStoryBuilderProps {
  brandData: any
}

export function BrandStoryBuilder({ brandData }: BrandStoryBuilderProps) {
  const fullProfile = brandData?.full_profile_data || {}

  // Extract story elements
  const originStory = {
    challenge: fullProfile.origin_challenge || 'Started with a vision to serve the community',
    turningPoint:
      fullProfile.origin_turning_point || 'First breakthrough moment that defined our mission',
    missionBorn: fullProfile.mission_born || 'Committed to excellence and customer care'
  }

  const narrativeArc = {
    statusQuo:
      fullProfile.status_quo ||
      brandData?.positioning_statement ||
      'The market before we arrived',
    incitingIncident:
      fullProfile.inciting_incident || 'The problem we saw that needed solving',
    resolution: fullProfile.resolution || brandData?.brand_purpose || 'How we make a difference'
  }

  const transformation = {
    before: fullProfile.transformation_before || [
      'Uncertainty',
      'Frustration',
      'Unexpected costs',
      'Lack of trust'
    ],
    after: fullProfile.transformation_after || [
      'Peace of mind',
      'Confidence',
      'Budget certainty',
      'Trusted partner'
    ]
  }

  // Use arrays if they're provided
  const transformBefore = Array.isArray(transformation.before)
    ? transformation.before
    : [transformation.before]
  const transformAfter = Array.isArray(transformation.after)
    ? transformation.after
    : [transformation.after]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Your Brand Story
        </CardTitle>
        <CardDescription>
          The narrative that makes your brand memorable and meaningful
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Origin Story */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Origin Story
          </h4>

          <div className="space-y-3">
            {/* The Challenge */}
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                <h5 className="font-semibold text-sm">The Challenge</h5>
              </div>
              <p className="text-sm text-muted-foreground">{originStory.challenge}</p>
            </div>

            {/* Turning Point */}
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 rounded-full bg-yellow-500" />
                <h5 className="font-semibold text-sm">Turning Point</h5>
              </div>
              <p className="text-sm text-muted-foreground">{originStory.turningPoint}</p>
            </div>

            {/* Mission Born */}
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <h5 className="font-semibold text-sm">Mission Born</h5>
              </div>
              <p className="text-sm text-muted-foreground">{originStory.missionBorn}</p>
            </div>
          </div>
        </div>

        {/* Narrative Arc */}
        <div className="space-y-4 pt-4 border-t">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Narrative Arc
          </h4>

          <div className="space-y-3">
            {/* Status Quo */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <Badge variant="outline" className="text-xs">
                  1
                </Badge>
              </div>
              <div className="flex-1">
                <h5 className="font-semibold text-sm mb-1">Status Quo</h5>
                <p className="text-sm text-muted-foreground">{narrativeArc.statusQuo}</p>
              </div>
            </div>

            <div className="flex justify-center">
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>

            {/* Inciting Incident */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <Badge variant="outline" className="text-xs">
                  2
                </Badge>
              </div>
              <div className="flex-1">
                <h5 className="font-semibold text-sm mb-1">Inciting Incident</h5>
                <p className="text-sm text-muted-foreground">{narrativeArc.incitingIncident}</p>
              </div>
            </div>

            <div className="flex justify-center">
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>

            {/* Resolution */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <Badge variant="outline" className="text-xs">
                  3
                </Badge>
              </div>
              <div className="flex-1">
                <h5 className="font-semibold text-sm mb-1">Resolution</h5>
                <p className="text-sm text-muted-foreground">{narrativeArc.resolution}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Transformation Promise */}
        <div className="space-y-4 pt-4 border-t">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Transformation Promise
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Before */}
            <div className="rounded-lg border p-4 space-y-3">
              <h5 className="font-semibold text-sm flex items-center gap-2">
                <span className="text-red-500">Before</span>
              </h5>
              <ul className="space-y-2">
                {transformBefore.slice(0, 4).map((item, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <span className="text-red-500">✗</span>
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* After */}
            <div className="rounded-lg border p-4 space-y-3 bg-primary/5">
              <h5 className="font-semibold text-sm flex items-center gap-2">
                <span className="text-green-600">After</span>
              </h5>
              <ul className="space-y-2">
                {transformAfter.slice(0, 4).map((item, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <span className="text-green-600">✓</span>
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 pt-4 border-t">
          <Button variant="outline" className="w-full">
            <FileText className="h-4 w-4 mr-2" />
            Generate About Page
          </Button>
          <Button variant="outline" className="w-full">
            <Users className="h-4 w-4 mr-2" />
            Create Founder Post
          </Button>
        </div>

        <Button className="w-full" size="lg">
          <Sparkles className="h-4 w-4 mr-2" />
          Generate Full Brand Story with Synapse
        </Button>

        {/* Story Summary */}
        <div className="rounded-lg bg-muted/50 p-4 text-sm">
          <p className="text-muted-foreground">
            <strong>Your Brand Story in One Line:</strong> From {originStory.challenge.toLowerCase()}, through {narrativeArc.incitingIncident.toLowerCase()}, we now {narrativeArc.resolution.toLowerCase()}.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
