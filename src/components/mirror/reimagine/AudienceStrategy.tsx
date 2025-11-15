import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CustomerPersona, StrategyBuilder } from '@/services/mirror/strategy-builder'
import { Users, Target, Heart, TrendingUp, MapPin, DollarSign, Sparkles } from 'lucide-react'

interface AudienceStrategyProps {
  brandData: any
  objectives: any[]
  situationAnalysis: any
  onSave?: (strategy: any) => void
  className?: string
}

export const AudienceStrategy: React.FC<AudienceStrategyProps> = ({
  brandData,
  objectives,
  situationAnalysis,
  onSave,
  className,
}) => {
  const [personas, setPersonas] = React.useState<CustomerPersona[]>([])
  const [selectedPersona, setSelectedPersona] = React.useState<string | null>(null)
  const [isGenerating, setIsGenerating] = React.useState(false)

  React.useEffect(() => {
    if (brandData && objectives.length > 0) {
      generatePersonas()
    }
  }, [brandData, objectives])

  const generatePersonas = async () => {
    setIsGenerating(true)
    try {
      const generated = StrategyBuilder.generatePersonas({
        demographics: situationAnalysis,
        industry: brandData.industry || 'Technology',
        objectives,
      })
      setPersonas(generated)
      if (generated.length > 0) {
        setSelectedPersona(generated[0].id)
      }
    } catch (error) {
      console.error('Failed to generate personas:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const journeyStages = [
    { stage: 'awareness', label: 'Awareness', touchpoints: ['Social media', 'Search', 'Industry content'] },
    { stage: 'consideration', label: 'Consideration', touchpoints: ['Webinars', 'Case studies', 'Product demos'] },
    { stage: 'decision', label: 'Decision', touchpoints: ['Free trial', 'Sales consultation', 'ROI calculator'] },
    { stage: 'retention', label: 'Retention', touchpoints: ['Onboarding', 'Success check-ins', 'Educational resources'] },
    { stage: 'advocacy', label: 'Advocacy', touchpoints: ['Referral program', 'User community', 'Co-marketing'] },
  ]

  const selectedPersonaData = personas.find((p) => p.id === selectedPersona)

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle>Audience Strategy</CardTitle>
            </div>
            <Button size="sm" variant="outline" onClick={generatePersonas} disabled={isGenerating}>
              <Sparkles className="h-4 w-4 mr-2" />
              {isGenerating ? 'Generating...' : 'Regenerate'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {personas.length === 0 ? (
            <Card className="p-6 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-muted-foreground">No personas yet</p>
              <p className="text-sm text-muted-foreground">Generate personas based on your objectives</p>
            </Card>
          ) : (
            <>
              {/* Persona Selector */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {personas.map((persona) => (
                  <Button
                    key={persona.id}
                    variant={selectedPersona === persona.id ? 'default' : 'outline'}
                    onClick={() => setSelectedPersona(persona.id)}
                    className="flex-shrink-0"
                  >
                    {persona.name}
                  </Button>
                ))}
              </div>

              {/* Selected Persona Details */}
              {selectedPersonaData && (
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="psychographics">Psychographics</TabsTrigger>
                    <TabsTrigger value="behavior">Behavior</TabsTrigger>
                    <TabsTrigger value="journey">Journey</TabsTrigger>
                  </TabsList>

                  {/* Overview Tab */}
                  <TabsContent value="overview" className="space-y-4">
                    <Card className="p-4">
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-semibold">{selectedPersonaData.name}</h3>
                          <p className="text-sm text-muted-foreground">{selectedPersonaData.role}</p>
                          <Badge variant="secondary" className="mt-2">
                            {selectedPersonaData.journey_stage}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium">
                              <Users className="h-4 w-4" />
                              Age Range
                            </div>
                            <p className="text-sm">{selectedPersonaData.demographics.age_range}</p>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium">
                              <MapPin className="h-4 w-4" />
                              Location
                            </div>
                            <p className="text-sm">{selectedPersonaData.demographics.location}</p>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium">
                              <DollarSign className="h-4 w-4" />
                              Income
                            </div>
                            <p className="text-sm">{selectedPersonaData.demographics.income_level}</p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </TabsContent>

                  {/* Psychographics Tab */}
                  <TabsContent value="psychographics" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Card className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Heart className="h-4 w-4 text-red-500" />
                          <h4 className="font-semibold">Values</h4>
                        </div>
                        <div className="space-y-1">
                          {selectedPersonaData.psychographics.values.map((value, i) => (
                            <Badge key={i} variant="outline">
                              {value}
                            </Badge>
                          ))}
                        </div>
                      </Card>

                      <Card className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Target className="h-4 w-4 text-blue-500" />
                          <h4 className="font-semibold">Goals</h4>
                        </div>
                        <ul className="space-y-1 text-sm">
                          {selectedPersonaData.psychographics.goals.map((goal, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-primary">•</span>
                              <span>{goal}</span>
                            </li>
                          ))}
                        </ul>
                      </Card>
                    </div>

                    <Card className="p-4 border-l-4 border-l-orange-500">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="h-4 w-4 text-orange-500" />
                        <h4 className="font-semibold">Pain Points</h4>
                      </div>
                      <ul className="space-y-2 text-sm">
                        {selectedPersonaData.psychographics.pain_points.map((pain, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-orange-500">⚠</span>
                            <span>{pain}</span>
                          </li>
                        ))}
                      </ul>
                    </Card>

                    <Card className="p-4">
                      <h4 className="font-semibold mb-3">Motivations</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedPersonaData.psychographics.motivations.map((motivation, i) => (
                          <Badge key={i} variant="secondary">
                            {motivation}
                          </Badge>
                        ))}
                      </div>
                    </Card>
                  </TabsContent>

                  {/* Behavior Tab */}
                  <TabsContent value="behavior" className="space-y-4">
                    <Card className="p-4">
                      <h4 className="font-semibold mb-3">Preferred Channels</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedPersonaData.behavior.preferred_channels.map((channel, i) => (
                          <Badge key={i} variant="default">
                            {channel}
                          </Badge>
                        ))}
                      </div>
                    </Card>

                    <Card className="p-4">
                      <h4 className="font-semibold mb-3">Content Preferences</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedPersonaData.behavior.content_preferences.map((pref, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <span className="text-primary">✓</span>
                            <span>{pref}</span>
                          </div>
                        ))}
                      </div>
                    </Card>

                    <Card className="p-4 border-l-4 border-l-green-500">
                      <h4 className="font-semibold mb-3">Buying Triggers</h4>
                      <ul className="space-y-2 text-sm">
                        {selectedPersonaData.behavior.buying_triggers.map((trigger, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-green-500">→</span>
                            <span>{trigger}</span>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  </TabsContent>

                  {/* Journey Tab */}
                  <TabsContent value="journey" className="space-y-4">
                    <div className="space-y-3">
                      {journeyStages.map((stage, i) => (
                        <Card
                          key={stage.stage}
                          className={`p-4 ${
                            selectedPersonaData.journey_stage === stage.stage
                              ? 'border-l-4 border-l-primary bg-primary/5'
                              : ''
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant={selectedPersonaData.journey_stage === stage.stage ? 'default' : 'outline'}>
                                {i + 1}
                              </Badge>
                              <h4 className="font-semibold">{stage.label}</h4>
                              {selectedPersonaData.journey_stage === stage.stage && (
                                <Badge variant="secondary">Current Stage</Badge>
                              )}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground font-medium">Key Touchpoints:</p>
                            <div className="flex flex-wrap gap-1">
                              {stage.touchpoints.map((touchpoint, j) => (
                                <Badge key={j} variant="outline" className="text-xs">
                                  {touchpoint}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
