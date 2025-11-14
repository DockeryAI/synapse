/**
 * Step 1: Customer Selection
 * User selects from pre-built personas or creates custom
 * Shows customer avatar with orbiting traits when selected
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Lightbulb } from 'lucide-react'
import { PersonaGallery } from '../visual/PersonaGallery'
import { CustomerAvatar } from '../visual/CustomerAvatar'
import { getPersonasForIndustry } from '@/data/buyer-personas'
import type { CustomerPersona } from '@/types/buyer-journey'

interface CustomerSelectionStepProps {
  industry?: string
  onPersonaSelect: (persona: CustomerPersona) => void
  selectedPersona?: CustomerPersona
  brandName?: string
  hasUVPData?: boolean
  isEnhancing?: boolean
}

export const CustomerSelectionStep: React.FC<CustomerSelectionStepProps> = ({
  industry = 'Professional Services',
  onPersonaSelect,
  selectedPersona,
  brandName,
  hasUVPData = false,
  isEnhancing = false,
}) => {
  const [personas, setPersonas] = useState<CustomerPersona[]>([])
  const [showCustomForm, setShowCustomForm] = useState(false)

  // Load personas for industry
  useEffect(() => {
    const industryPersonas = getPersonasForIndustry(industry)
    setPersonas(industryPersonas)
  }, [industry])

  const handleCreateCustom = () => {
    setShowCustomForm(true)
    // TODO: Implement custom persona form
  }

  return (
    <div className="space-y-8">
      {/* AI Pre-fill Notice */}
      <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
        <Lightbulb className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-sm text-blue-900 dark:text-blue-100">
          {hasUVPData ? (
            <>
              <strong>Smart Start:</strong> Select a customer type that matches {brandName ? `${brandName}'s` : 'your'} target audience.
              We'll automatically customize it with your UVP analysis, website data, and industry insights.
            </>
          ) : (
            <>
              <strong>Smart Start:</strong> We've identified {personas.length} common customer types in the{' '}
              {industry} industry based on market data. Select one to get started.
            </>
          )}
        </AlertDescription>
      </Alert>

      {/* Persona Selection */}
      {!showCustomForm && (
        <PersonaGallery
          personas={personas}
          selectedPersona={selectedPersona}
          onSelect={onPersonaSelect}
          onCreateCustom={handleCreateCustom}
          showCreateCustom={false} // Disabled for MVP - focus on pre-built personas
        />
      )}

      {/* Visual Confirmation - Customer Avatar with Orbits */}
      {selectedPersona && !showCustomForm && (
        <Card className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 border-2">
          <CardContent className="py-12">
            <div className="text-center mb-8">
              <h3 className="text-xl font-bold mb-2">Your Ideal Customer</h3>
              <p className="text-sm text-muted-foreground">
                {isEnhancing
                  ? '✨ AI is customizing this persona with your brand data...'
                  : 'This persona will guide your journey mapping'
                }
              </p>
            </div>

            {/* Animated Customer Avatar with Orbiting Traits */}
            <div className="flex items-center justify-center min-h-[400px]">
              <CustomerAvatar
                persona={selectedPersona}
                size="lg"
                showOrbits={true}
                animated={true}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Custom Persona Form (placeholder for future) */}
      {showCustomForm && (
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Custom Persona Builder</h3>
              <p className="text-sm text-muted-foreground">
                Coming soon - For MVP, please select from pre-built personas above
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
