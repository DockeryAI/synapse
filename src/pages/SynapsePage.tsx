/**
 * SYNAPSE SMB PLATFORM - Simplified Version for Phase 1
 *
 * This is a simplified version to get the project building.
 * Full implementation will be added in subsequent phases.
 */

import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function SynapsePage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Synapse SMB Platform
          </h1>
          <p className="text-xl text-gray-600">
            Fast, intelligent SMB onboarding with automated content generation
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">3-Minute Onboarding</h3>
            <p className="text-gray-600">
              Smart UVP wizard with evidence-based suggestions
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">1-Minute Content</h3>
            <p className="text-gray-600">
              Platform-optimized content generation
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">Automated Scheduling</h3>
            <p className="text-gray-600">
              Direct integration with SocialPilot
            </p>
          </Card>
        </div>

        <div className="text-center">
          <Button size="lg" className="text-lg px-8 py-6">
            Get Started
          </Button>
        </div>
      </div>
    </div>
  )
}
