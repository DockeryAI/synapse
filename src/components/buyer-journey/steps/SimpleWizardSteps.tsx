/**
 * Simplified Wizard Steps
 * Functional placeholder components for buyer journey wizard steps
 * These allow the wizard to be completed while providing basic functionality
 */

import React from 'react'
import { Card } from '@/components/ui/card'
import { Lightbulb, Map, TouchpadIcon, AlertCircle, Target, CheckCircle } from 'lucide-react'

// Jobs To Be Done Step
export const JobsToBeDoneStep: React.FC = () => (
  <Card className="p-8">
    <div className="text-center space-y-4">
      <Lightbulb className="h-16 w-16 mx-auto text-primary opacity-50" />
      <h3 className="text-lg font-semibold">Jobs To Be Done Framework</h3>
      <p className="text-muted-foreground max-w-2xl mx-auto">
        This step helps you identify the functional, emotional, and social jobs customers "hire" your business to do.
        In the full implementation, you'll map out customer jobs using the JTBD framework.
      </p>
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-left max-w-xl mx-auto">
        <strong className="block mb-2">What You'll Define:</strong>
        <ul className="space-y-1 text-muted-foreground">
          <li>• Functional jobs (tasks to accomplish)</li>
          <li>• Emotional jobs (how they want to feel)</li>
          <li>• Social jobs (how they want to be perceived)</li>
          <li>• Job importance and satisfaction scores</li>
        </ul>
      </div>
    </div>
  </Card>
)

// Journey Stages Step
export const JourneyStagesStep: React.FC = () => (
  <Card className="p-8">
    <div className="text-center space-y-4">
      <Map className="h-16 w-16 mx-auto text-primary opacity-50" />
      <h3 className="text-lg font-semibold">Journey Stages Mapping</h3>
      <p className="text-muted-foreground max-w-2xl mx-auto">
        Map how customers move through each stage from awareness to advocacy.
        The framework includes: Awareness → Consideration → Decision → Purchase → Delivery → Post-Purchase → Advocacy
      </p>
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-left max-w-xl mx-auto">
        <strong className="block mb-2">For Each Stage:</strong>
        <ul className="space-y-1 text-muted-foreground">
          <li>• Customer questions at this stage</li>
          <li>• Emotional state and concerns</li>
          <li>• Typical duration</li>
          <li>• Success criteria for moving forward</li>
        </ul>
      </div>
    </div>
  </Card>
)

// Touchpoints Step
export const TouchpointsStep: React.FC = () => (
  <Card className="p-8">
    <div className="text-center space-y-4">
      <TouchpadIcon className="h-16 w-16 mx-auto text-primary opacity-50" />
      <h3 className="text-lg font-semibold">Touchpoint Definition</h3>
      <p className="text-muted-foreground max-w-2xl mx-auto">
        Identify every point where customers interact with your brand throughout their journey.
        Map touchpoints to specific journey stages and rate their effectiveness.
      </p>
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-left max-w-xl mx-auto">
        <strong className="block mb-2">Touchpoint Examples:</strong>
        <ul className="space-y-1 text-muted-foreground">
          <li>• Google Search results</li>
          <li>• Website homepage and landing pages</li>
          <li>• Phone calls and consultations</li>
          <li>• Email communications</li>
          <li>• Social media interactions</li>
          <li>• In-person service delivery</li>
          <li>• Follow-up and review requests</li>
        </ul>
      </div>
    </div>
  </Card>
)

// Pain Points Step
export const PainPointsStep: React.FC = () => (
  <Card className="p-8">
    <div className="text-center space-y-4">
      <AlertCircle className="h-16 w-16 mx-auto text-yellow-600 opacity-50" />
      <h3 className="text-lg font-semibold">Identify Friction Points</h3>
      <p className="text-muted-foreground max-w-2xl mx-auto">
        Find where customers experience frustration, confusion, or drop off in their journey.
        Understanding friction helps prioritize improvements that matter most.
      </p>
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-left max-w-xl mx-auto">
        <strong className="block mb-2">Common Friction Types:</strong>
        <ul className="space-y-1 text-muted-foreground">
          <li>• Information friction (hard to find answers)</li>
          <li>• Trust friction (credibility concerns)</li>
          <li>• Complexity friction (too confusing)</li>
          <li>• Time friction (takes too long)</li>
          <li>• Cost friction (price concerns)</li>
          <li>• Access friction (hard to reach)</li>
        </ul>
      </div>
    </div>
  </Card>
)

// Opportunities Step
export const OpportunitiesStep: React.FC = () => (
  <Card className="p-8">
    <div className="text-center space-y-4">
      <Target className="h-16 w-16 mx-auto text-green-600 opacity-50" />
      <h3 className="text-lg font-semibold">Map Opportunities</h3>
      <p className="text-muted-foreground max-w-2xl mx-auto">
        Prioritize improvements based on impact and effort. Focus on quick wins that solve customer pain points
        and strategic initiatives that differentiate your business.
      </p>
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-left max-w-xl mx-auto">
        <strong className="block mb-2">Opportunity Categories:</strong>
        <ul className="space-y-1 text-muted-foreground">
          <li>• Quick Wins (high impact, low effort)</li>
          <li>• Strategic (high impact, high effort)</li>
          <li>• Nice to Have (low impact, low effort)</li>
          <li>• Transformational (game-changing initiatives)</li>
        </ul>
      </div>
    </div>
  </Card>
)

// Review Step
export const ReviewStep: React.FC = () => (
  <Card className="p-8">
    <div className="text-center space-y-4">
      <CheckCircle className="h-16 w-16 mx-auto text-green-600 opacity-50" />
      <h3 className="text-lg font-semibold">Review & Complete</h3>
      <p className="text-muted-foreground max-w-2xl mx-auto">
        Your buyer journey map is ready! This framework will now enhance your customer truth analysis
        with real ICP data instead of guesses.
      </p>
      <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm text-left max-w-xl mx-auto">
        <strong className="block mb-2">What Happens Next:</strong>
        <ul className="space-y-2 text-muted-foreground">
          <li>✓ Customer Truth will use your defined ICP for demographic matching</li>
          <li>✓ Pain points and opportunities inform Mirror diagnostics</li>
          <li>✓ Journey stages help identify gaps in your marketing funnel</li>
          <li>✓ Touchpoint analysis improves brand consistency scoring</li>
        </ul>
      </div>
      <div className="mt-6">
        <p className="text-sm font-medium text-primary">
          Click "Complete Journey Map" to unlock enhanced customer analytics →
        </p>
      </div>
    </div>
  </Card>
)
