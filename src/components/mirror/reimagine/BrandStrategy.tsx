import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MessagePillar, StrategyBuilder } from '@/services/mirror/strategy-builder'
import { SynapseAutoAnalyzer } from '@/services/intelligence/synapse-auto-analyzer'
import { SynapseLiveScoring } from './SynapseLiveScoring'
import { Sparkles, Target, Edit, Save, Plus, Trash2, Award } from 'lucide-react'

interface BrandStrategyProps {
  brandData: any
  objectives: any[]
  onSave?: (strategy: any) => void
  className?: string
}

export const BrandStrategy: React.FC<BrandStrategyProps> = ({
  brandData,
  objectives,
  onSave,
  className,
}) => {
  const [positioning, setPositioning] = React.useState('')
  const [synapseScore, setSynapseScore] = React.useState<number | null>(null)
  const [pillars, setPillars] = React.useState<MessagePillar[]>([])
  const [isEditingPositioning, setIsEditingPositioning] = React.useState(false)
  const [isGenerating, setIsGenerating] = React.useState(false)

  // Load existing strategy from database first
  React.useEffect(() => {
    if (brandData?.brandStrategy) {
      // Use loaded data from database
      setPositioning(brandData.brandStrategy.positioning_statement || '')
      setPillars(brandData.brandStrategy.message_pillars || [])
    } else if (brandData && objectives.length > 0) {
      // Only generate if no data exists
      generateRecommendedStrategy()
    }
  }, [brandData, objectives])

  const generateRecommendedStrategy = async () => {
    setIsGenerating(true)
    try {
      const recommended = StrategyBuilder.generatePositioningStatement({
        name: brandData.name || 'Your Brand',
        industry: brandData.industry || 'Technology',
        target_audience: 'marketing professionals who need strategic clarity',
        unique_value: 'AI-powered marketing intelligence',
        competitors: brandData.competitors?.slice(0, 2) || [],
      })

      setPositioning(recommended)

      // Score with Synapse
      const score = await SynapseAutoAnalyzer.scorePositioningStatement(recommended)
      setSynapseScore(score.overall_score)

      // Generate message pillars
      const recommendedPillars = StrategyBuilder.generateMessagePillars(
        objectives,
        recommended,
        brandData.industry
      )
      setPillars(recommendedPillars)
    } catch (error) {
      console.error('Failed to generate strategy:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePositioningChange = async (value: string) => {
    setPositioning(value)
    if (value.length > 20) {
      const score = await SynapseAutoAnalyzer.scorePositioningStatement(value)
      setSynapseScore(score.overall_score)
    } else {
      setSynapseScore(null)
    }
  }

  const handleAddPillar = () => {
    const newPillar: MessagePillar = {
      id: `pillar-${Date.now()}`,
      title: '',
      description: '',
      key_messages: [''],
      supporting_proof: [''],
      tone: 'professional',
      priority: pillars.length + 1,
    }
    setPillars([...pillars, newPillar])
  }

  const handleUpdatePillar = (id: string, updates: Partial<MessagePillar>) => {
    setPillars(pillars.map((p) => (p.id === id ? { ...p, ...updates } : p)))
  }

  const handleDeletePillar = (id: string) => {
    setPillars(pillars.filter((p) => p.id !== id))
  }

  const handleSave = () => {
    if (onSave) {
      onSave({
        positioning_statement: positioning,
        synapse_score: synapseScore,
        message_pillars: pillars,
      })
    }
  }

  const getSynapseColor = (score: number | null) => {
    if (!score) return 'text-muted-foreground'
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <CardTitle>Brand Strategy</CardTitle>
            </div>
            <Button size="sm" variant="outline" onClick={generateRecommendedStrategy} disabled={isGenerating}>
              <Sparkles className="h-4 w-4 mr-2" />
              {isGenerating ? 'Generating...' : 'Regenerate'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Positioning Statement */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Positioning Statement</Label>
              <div className="flex items-center gap-2">
                {synapseScore !== null && (
                  <div className="flex items-center gap-2">
                    <Award className={`h-4 w-4 ${getSynapseColor(synapseScore)}`} />
                    <span className={`text-sm font-bold ${getSynapseColor(synapseScore)}`}>
                      {Math.round(synapseScore)}
                    </span>
                  </div>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditingPositioning(!isEditingPositioning)}
                >
                  {isEditingPositioning ? <Save className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {isEditingPositioning ? (
              <SynapseLiveScoring
                value={positioning}
                onChange={handlePositioningChange}
                brandData={brandData}
                placeholder="For [target audience] who need [key benefit], [brand] is a [category] that [unique differentiator]..."
                label=""
                minScore={7}
              />
            ) : (
              <Card className="p-4 bg-muted/50">
                <p className="text-base leading-relaxed">{positioning || 'No positioning statement yet'}</p>
              </Card>
            )}
          </div>

          {/* Message Pillars */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Message Pillars</Label>
              <Button size="sm" variant="outline" onClick={handleAddPillar}>
                <Plus className="h-4 w-4 mr-2" />
                Add Pillar
              </Button>
            </div>

            <div className="space-y-4">
              {pillars.length === 0 ? (
                <Card className="p-6 text-center">
                  <p className="text-muted-foreground">No message pillars yet</p>
                  <p className="text-sm text-muted-foreground">Add pillars to define your core messages</p>
                </Card>
              ) : (
                pillars.map((pillar, index) => (
                  <Card key={pillar.id} className="p-4 border-l-4 border-l-primary">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">#{index + 1}</Badge>
                          <Input
                            value={pillar.title}
                            onChange={(e) => handleUpdatePillar(pillar.id, { title: e.target.value })}
                            placeholder="Pillar title"
                            className="font-semibold"
                          />
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeletePillar(pillar.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <Textarea
                        value={pillar.description}
                        onChange={(e) => handleUpdatePillar(pillar.id, { description: e.target.value })}
                        placeholder="Describe this message pillar..."
                        rows={2}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm">Tone</Label>
                          <Select
                            value={pillar.tone}
                            onValueChange={(v) => handleUpdatePillar(pillar.id, { tone: v as any })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="professional">Professional</SelectItem>
                              <SelectItem value="friendly">Friendly</SelectItem>
                              <SelectItem value="authoritative">Authoritative</SelectItem>
                              <SelectItem value="inspirational">Inspirational</SelectItem>
                              <SelectItem value="playful">Playful</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm">Priority</Label>
                          <Input
                            type="number"
                            value={pillar.priority}
                            onChange={(e) =>
                              handleUpdatePillar(pillar.id, { priority: parseInt(e.target.value) })
                            }
                            min={1}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Key Messages</Label>
                        <div className="space-y-1">
                          {pillar.key_messages.map((msg, i) => (
                            <Input
                              key={i}
                              value={msg}
                              onChange={(e) => {
                                const updated = [...pillar.key_messages]
                                updated[i] = e.target.value
                                handleUpdatePillar(pillar.id, { key_messages: updated })
                              }}
                              placeholder="Key message..."
                              className="text-sm"
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>

          <Button onClick={handleSave} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            Save Brand Strategy
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
