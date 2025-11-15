import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ContentTheme, PlatformStrategy, CustomerPersona, StrategyBuilder } from '@/services/mirror/strategy-builder'
import { FileText, Calendar, BarChart3, Sparkles, Clock, Target } from 'lucide-react'

interface ContentStrategyProps {
  personas: CustomerPersona[]
  objectives: any[]
  onSave?: (strategy: any) => void
  className?: string
}

export const ContentStrategy: React.FC<ContentStrategyProps> = ({
  personas,
  objectives,
  onSave,
  className,
}) => {
  const [themes, setThemes] = React.useState<ContentTheme[]>([])
  const [platformStrategies, setPlatformStrategies] = React.useState<PlatformStrategy[]>([])
  const [isGenerating, setIsGenerating] = React.useState(false)

  React.useEffect(() => {
    if (personas.length > 0 && objectives.length > 0) {
      generateContentStrategy()
    }
  }, [personas, objectives])

  const generateContentStrategy = async () => {
    setIsGenerating(true)
    try {
      const generatedThemes = StrategyBuilder.generateContentThemes(personas, objectives)
      const generatedPlatforms = StrategyBuilder.generatePlatformStrategies(personas)

      setThemes(generatedThemes)
      setPlatformStrategies(generatedPlatforms)
    } catch (error) {
      console.error('Failed to generate content strategy:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'primary':
        return 'bg-green-500'
      case 'secondary':
        return 'bg-blue-500'
      case 'tertiary':
        return 'bg-gray-500'
      default:
        return 'bg-gray-400'
    }
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle>Content Strategy</CardTitle>
            </div>
            <Button size="sm" variant="outline" onClick={generateContentStrategy} disabled={isGenerating}>
              <Sparkles className="h-4 w-4 mr-2" />
              {isGenerating ? 'Generating...' : 'Regenerate'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Content Themes */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <h3 className="font-semibold">Content Themes</h3>
            </div>

            {themes.length === 0 ? (
              <Card className="p-6 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="text-muted-foreground">No content themes yet</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {themes.map((theme) => (
                  <Card key={theme.id} className="p-4 border-l-4 border-l-primary">
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{theme.name}</h4>
                          <Badge variant="outline">
                            <Calendar className="h-3 w-3 mr-1" />
                            {theme.frequency}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{theme.description}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium mb-1">Target Personas:</p>
                          <div className="flex flex-wrap gap-1">
                            {theme.target_personas.map((persona, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {persona}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="font-medium mb-1">Content Types:</p>
                          <div className="flex flex-wrap gap-1">
                            {theme.content_types.map((type, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {type}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="font-medium text-sm mb-1">Goals:</p>
                        <ul className="space-y-1 text-sm">
                          {theme.goals.map((goal, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-primary">•</span>
                              <span>{goal}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Platform Strategies */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <h3 className="font-semibold">Platform Strategies</h3>
            </div>

            {platformStrategies.length === 0 ? (
              <Card className="p-6 text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="text-muted-foreground">No platform strategies yet</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {platformStrategies.map((platform) => (
                  <Card key={platform.platform} className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-lg">{platform.platform}</h4>
                          <div className={`w-2 h-2 rounded-full ${getPriorityColor(platform.priority)}`} />
                          <Badge variant="secondary">{platform.priority}</Badge>
                        </div>
                        <Badge variant="outline">
                          <Clock className="h-3 w-3 mr-1" />
                          {platform.posting_frequency}
                        </Badge>
                      </div>

                      {/* Content Mix */}
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Content Mix:</p>
                        <div className="space-y-2">
                          {Object.entries(platform.content_mix).map(([type, percentage]) => (
                            <div key={type} className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span>{type}</span>
                                <span className="font-medium">{percentage}%</span>
                              </div>
                              <Progress value={percentage} className="h-2" />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Optimal Times */}
                      <div>
                        <p className="text-sm font-medium mb-2">Optimal Posting Times:</p>
                        <div className="flex flex-wrap gap-2">
                          {platform.optimal_times.map((time, i) => (
                            <Badge key={i} variant="outline">
                              <Clock className="h-3 w-3 mr-1" />
                              {time}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Key Metrics */}
                      <div>
                        <p className="text-sm font-medium mb-2">Key Metrics to Track:</p>
                        <div className="flex flex-wrap gap-2">
                          {platform.key_metrics.map((metric, i) => (
                            <Badge key={i} variant="secondary">
                              {metric}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Content Calendar Framework */}
          <Card className="p-4 bg-muted/50">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4" />
              <h4 className="font-semibold">Content Calendar Framework</h4>
            </div>
            <p className="text-sm">
              <strong>Recommended mix:</strong> 60% educational content, 30% thought leadership, 10% promotional
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              This balance helps build authority while maintaining audience engagement without being overly promotional.
            </p>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}
