/**
 * Persona Gallery Component
 * Shows 5 pre-built customer personas that users can select from
 * Includes "Create Custom" option
 */

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, Check } from 'lucide-react'
import type { CustomerPersona } from '@/types/buyer-journey'

interface PersonaGalleryProps {
  personas: CustomerPersona[]
  selectedPersona?: CustomerPersona
  onSelect: (persona: CustomerPersona) => void
  onCreateCustom?: () => void
  showCreateCustom?: boolean
  className?: string
}

export const PersonaGallery: React.FC<PersonaGalleryProps> = ({
  personas,
  selectedPersona,
  onSelect,
  onCreateCustom,
  showCreateCustom = true,
  className,
}) => {
  const [hoveredPersonaId, setHoveredPersonaId] = useState<string | null>(null)

  return (
    <div className={cn('space-y-4', className)}>
      {/* Instructions */}
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Choose Your Customer Type</h3>
        <p className="text-sm text-muted-foreground">
          Select the persona that best matches your ideal customer, or create a custom one
        </p>
      </div>

      {/* Persona Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {personas.map((persona, index) => {
          const isSelected = selectedPersona?.id === persona.id
          const isHovered = hoveredPersonaId === persona.id

          return (
            <Card
              key={persona.id}
              className={cn(
                'cursor-pointer transition-all duration-300 hover:shadow-xl',
                'border-2',
                isSelected && 'border-primary shadow-xl scale-105',
                !isSelected && 'border-gray-200 dark:border-gray-700 hover:border-gray-300',
                'animate-in fade-in-0 zoom-in-95'
              )}
              style={{
                animationDelay: `${index * 50}ms`,
                borderColor: isSelected ? persona.avatar_color : undefined,
              }}
              onClick={() => onSelect(persona)}
              onMouseEnter={() => setHoveredPersonaId(persona.id)}
              onMouseLeave={() => setHoveredPersonaId(null)}
            >
              <CardContent className="p-6">
                {/* Header with Avatar */}
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center border-4 border-white shadow-lg"
                    style={{ backgroundColor: persona.avatar_color }}
                  >
                    <span className="text-2xl">👤</span>
                  </div>

                  {isSelected && (
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: persona.avatar_color }}
                    >
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>

                {/* Persona Name */}
                <h4
                  className={cn(
                    'text-lg font-bold mb-1 transition-colors',
                    isSelected || isHovered ? 'scale-105' : ''
                  )}
                  style={{
                    color: isSelected || isHovered ? persona.avatar_color : undefined,
                  }}
                >
                  {persona.name}
                </h4>

                {/* Quick Description */}
                <p className="text-sm text-muted-foreground mb-4">{persona.quick_description}</p>

                {/* Key Traits */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {persona.key_traits.slice(0, 3).map((trait, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="text-xs"
                      style={{
                        backgroundColor:
                          isSelected || isHovered ? `${persona.avatar_color}20` : undefined,
                        color: isSelected || isHovered ? persona.avatar_color : undefined,
                      }}
                    >
                      {trait}
                    </Badge>
                  ))}
                  {persona.key_traits.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{persona.key_traits.length - 3}
                    </Badge>
                  )}
                </div>

                {/* Demographics Preview */}
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>Age: {persona.demographics.age_range}</div>
                  <div>Income: {persona.demographics.income_range}</div>
                </div>

                {/* Top Pain Point */}
                {persona.pain_points[0] && (
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      Top Pain Point:
                    </div>
                    <div className="text-sm line-clamp-2">{persona.pain_points[0]}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}

        {/* Create Custom Option */}
        {showCreateCustom && onCreateCustom && (
          <Card
            className={cn(
              'cursor-pointer transition-all duration-300',
              'border-2 border-dashed border-gray-300 dark:border-gray-700',
              'hover:border-primary hover:shadow-xl hover:scale-105',
              'bg-gray-50 dark:bg-gray-800/50',
              'animate-in fade-in-0 zoom-in-95'
            )}
            style={{
              animationDelay: `${personas.length * 50}ms`,
            }}
            onClick={onCreateCustom}
          >
            <CardContent className="p-6 flex flex-col items-center justify-center h-full min-h-[300px]">
              <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-4">
                <Plus className="h-8 w-8 text-gray-400" />
              </div>

              <h4 className="text-lg font-bold mb-2">Create Custom Persona</h4>

              <p className="text-sm text-muted-foreground text-center">
                Build a persona from scratch based on your specific customer data
              </p>

              <Button variant="outline" className="mt-4" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Start Custom
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Selected Persona Summary */}
      {selectedPersona && (
        <div className="mt-6">
          <PersonaDetailPanel
            persona={selectedPersona}
          />
        </div>
      )}
    </div>
  )
}

/**
 * Detailed panel showing selected persona info
 */
interface PersonaDetailPanelProps {
  persona: CustomerPersona
}

const PersonaDetailPanel: React.FC<PersonaDetailPanelProps> = ({ persona }) => {
  return (
    <Card className="border-2" style={{ borderColor: persona.avatar_color }}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center border-4 border-white shadow-lg flex-shrink-0"
            style={{ backgroundColor: persona.avatar_color }}
          >
            <span className="text-3xl">👤</span>
          </div>

          {/* Content */}
          <div className="flex-1 space-y-4">
            <div>
              <h4 className="text-xl font-bold mb-1" style={{ color: persona.avatar_color }}>
                {persona.name}
              </h4>
              <p className="text-sm text-muted-foreground">{persona.quick_description}</p>
            </div>

            {/* Pain Points */}
            <div>
              <div className="text-sm font-semibold mb-2">Top Pain Points:</div>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {persona.pain_points.map((point, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Goals */}
            <div>
              <div className="text-sm font-semibold mb-2">Goals:</div>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {persona.goals.map((goal, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">•</span>
                    <span>{goal}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
