import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sparkles, TrendingUp, Users, Target, ArrowRight, AlertCircle, Zap, Brain } from 'lucide-react'
import { ConnectionDiscoveryEngine } from '@/services/synapse/ConnectionDiscoveryEngine'
import type { Connection, DeepContext } from '@/types/connections.types'

interface ConnectionDiscoveryProps {
  brandData: any
}

export function ConnectionDiscovery({ brandData }: ConnectionDiscoveryProps) {
  const [connections, setConnections] = useState<Connection[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<any>(null)

  useEffect(() => {
    if (brandData?.id) {
      discoverConnections()
    }
  }, [brandData?.id])

  const discoverConnections = async () => {
    if (!brandData) {
      setError('Brand data is required to discover connections')
      return
    }

    setLoading(true)
    setError(null)
    setConnections([])
    setSummary(null)

    try {
      console.log('[ConnectionDiscovery] Building deep context...')

      // Build deep context from brand data
      const deepContext: DeepContext = {
        brand_id: brandData.id,
        industry: brandData.industry || 'general',
        keywords: brandData.keywords || [],
        triggers: brandData.emotional_triggers?.map((t: any) => t.trigger || t) || [],
        competitors: brandData.competitors || [],
        content_gaps: brandData.content_gaps || [],
        current_opportunities: brandData.current_opportunities || [],
        seo_data: brandData.seo_data || null,
        weather_data: brandData.weather_data || null,
        trend_data: brandData.trend_data || null,
        archetype: brandData.primary_archetype || 'Explorer',
        brand_voice: brandData.brand_voice || 'professional',
        target_personas: brandData.target_personas || [],
        benchmarks: brandData.benchmarks || null
      }

      console.log('[ConnectionDiscovery] Calling AI engine...')

      // Call the real Connection Discovery Engine
      const result = await ConnectionDiscoveryEngine.discoverConnections(deepContext, {
        minBreakthroughScore: 0.7,
        maxConnections: 15,
        includeWeakSignals: true,
        focusAreas: ['customer_psychology', 'market_trends', 'competitive_gaps', 'timing']
      })

      console.log(`[ConnectionDiscovery] Found ${result.connections.length} connections`)

      setConnections(result.connections)
      setSummary(result.summary)

    } catch (err: any) {
      setError(err.message || 'Failed to discover connections')
      console.error('[ConnectionDiscovery] Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const getConnectionIcon = (type: string) => {
    // Connections are now 2-way, 3-way, 4-way based on data points
    return <Brain className="h-5 w-5" />
  }

  const getConnectionColor = (confidence: number) => {
    if (confidence >= 0.9) return 'bg-green-50 text-green-900 border-green-300'
    if (confidence >= 0.8) return 'bg-blue-50 text-blue-900 border-blue-300'
    if (confidence >= 0.7) return 'bg-purple-50 text-purple-900 border-purple-300'
    return 'bg-gray-50 text-gray-900 border-gray-300'
  }

  const getTypeLabel = (type: string) => {
    return `${type.replace('-', ' ').toUpperCase()} CONNECTION`
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 animate-pulse" />
            Discovering Connections...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <p>Analyzing your brand data for hidden opportunities...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Connection Discovery
          </CardTitle>
          <CardDescription>
            Discover unexpected insights connecting your brand data, customer psychology, and market opportunities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border-2 border-orange-200 bg-orange-50 p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-orange-900 mb-2">Feature In Development</h4>
                <p className="text-sm text-orange-800 mb-4">{error}</p>
                <div className="bg-white rounded p-4 border border-orange-200 mb-4">
                  <p className="text-sm font-semibold text-orange-900 mb-2">What this feature will do:</p>
                  <ul className="text-xs text-orange-800 space-y-1">
                    <li>• Find unexpected connections between customer triggers and market trends</li>
                    <li>• Identify competitor weaknesses aligned with your strengths</li>
                    <li>• Discover content gaps that match trending topics</li>
                    <li>• Map customer archetypes to optimal channel strategies</li>
                  </ul>
                </div>
                <p className="text-xs text-orange-700">
                  To enable this feature, configure your OpenAI API key and ensure all data sources are connected.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show success state with connections
  if (connections.length > 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Connection Discovery
              </CardTitle>
              <CardDescription>
                AI-discovered insights connecting disparate data points
              </CardDescription>
            </div>
            {summary && (
              <Badge variant="secondary" className="text-xs">
                {summary.breakthrough_insights} breakthroughs
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {connections.map((connection) => (
            <div
              key={connection.id}
              className={`rounded-lg border-2 p-4 transition-all hover:shadow-md ${getConnectionColor(connection.confidence)}`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wide">
                    {getTypeLabel(connection.type)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {Math.round(connection.breakthrough_score * 100)}% breakthrough
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {Math.round(connection.confidence * 100)}%
                  </Badge>
                </div>
              </div>

              {/* Title and Description */}
              <h4 className="font-semibold mb-2">{connection.title}</h4>
              <p className="text-sm text-muted-foreground mb-3">{connection.description}</p>

              {/* Data Points */}
              {connection.data_points && connection.data_points.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {connection.data_points.map((dp, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {dp.source}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Content Angle */}
              {connection.content_angle && (
                <div className="bg-white/50 rounded p-2 mb-3">
                  <p className="text-xs font-semibold mb-1">Content Angle:</p>
                  <p className="text-xs">{connection.content_angle}</p>
                </div>
              )}

              {/* Suggested Actions */}
              {connection.suggested_actions && connection.suggested_actions.length > 0 && (
                <div className="mt-3 pt-3 border-t border-current/20">
                  <p className="text-xs font-semibold mb-2">Suggested Actions:</p>
                  <ul className="space-y-2">
                    {connection.suggested_actions.slice(0, 3).map((action, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs">
                        <ArrowRight className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-medium">{action.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs px-1 py-0">
                              {action.priority}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{action.estimated_effort}</span>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {action.potential_impact}%
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}

          <Button onClick={discoverConnections} variant="outline" className="w-full mt-4">
            <Sparkles className="h-4 w-4 mr-2" />
            Refresh Connections
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Empty state
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Connection Discovery
        </CardTitle>
        <CardDescription>
          AI-powered analysis to find unexpected connections in your brand data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <Brain className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">No connections discovered yet.</p>
          <Button onClick={discoverConnections} variant="default">
            <Sparkles className="h-4 w-4 mr-2" />
            Discover Connections
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
