import * as React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Target, Calendar, BarChart3, Lightbulb, Palette, TrendingUp, Sparkles, ArrowRight, PlayCircle, Settings } from 'lucide-react'
import { SessionService } from '@/services/session/session.service'

export const HomePage: React.FC = () => {
  const navigate = useNavigate()
  const [recentSessions, setRecentSessions] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  // Load recent sessions on mount
  React.useEffect(() => {
    const loadSessions = async () => {
      try {
        const sessions = await SessionService.getRecentSessions(5)
        setRecentSessions(sessions)
      } catch (error) {
        console.error('[HomePage] Failed to load sessions:', error)
      } finally {
        setLoading(false)
      }
    }
    loadSessions()
  }, [])

  const handleResumeSession = async (sessionId: string) => {
    try {
      await SessionService.setActiveSession(sessionId)
      // Navigate to the section where the session was
      navigate('/mirror')
    } catch (error) {
      console.error('[HomePage] Failed to resume session:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-8">
      <div className="space-y-16 max-w-7xl mx-auto">
      {/* Hero */}
      <section className="text-center py-12">
        <div className="flex items-center justify-center gap-4 mb-4">
          <Badge>AI-Powered Marketing Strategy Platform</Badge>
          <Link to="/admin">
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Admin
            </Button>
          </Link>
        </div>
        <h1 className="text-6xl font-bold mb-6">
          Welcome to <span className="text-primary">MARBA.ai</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Transform your marketing with the MARBA framework, AI-powered insights,
          and actionable tactics that drive real results.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/onboarding">
            <Button size="lg">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link to="/intelligence">
            <Button size="lg" variant="outline">
              View Real-Time Opportunities
            </Button>
          </Link>
        </div>
      </section>

      {/* Recent Sessions */}
      {!loading && recentSessions.length > 0 && (
        <section>
          <h3 className="text-3xl font-bold text-center mb-8">
            Resume Your Work
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {recentSessions.map((session) => (
              <Card key={session.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">{session.session_name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(session.last_accessed_at).toLocaleDateString()}
                      </p>
                    </div>
                    <PlayCircle className="h-5 w-5 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {session.context_summary || 'Continue where you left off'}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleResumeSession(session.id)}
                  >
                    Resume Session
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Quick Access Features */}
      <section>
        <h3 className="text-3xl font-bold text-center mb-12">
          Platform Features
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* MARBA Framework */}
          <Link to="/mirror">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <Target className="h-8 w-8 text-primary mb-2" />
                <CardTitle>MARBA Framework</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Complete strategic framework: Mirror, Align, Roadmap, Broadcast, Assess
                </p>
                <Badge className="bg-green-500">Complete</Badge>
              </CardContent>
            </Card>
          </Link>

          {/* Content Calendar */}
          <Link to="/content-calendar">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <Calendar className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Content Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  AI-powered content creation, scheduling, and publishing across all platforms
                </p>
                <Badge className="bg-green-500">Complete</Badge>
              </CardContent>
            </Card>
          </Link>

          {/* Analytics */}
          <Link to="/analytics">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <BarChart3 className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Track performance, measure goals, and gain actionable insights
                </p>
                <Badge className="bg-green-500">Complete</Badge>
              </CardContent>
            </Card>
          </Link>

          {/* Intelligence Hub */}
          <Link to="/intelligence">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <Lightbulb className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Intelligence Hub</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Real-time opportunities from weather, trends, competitors, and events
                </p>
                <Badge className="bg-green-500">Complete</Badge>
              </CardContent>
            </Card>
          </Link>

          {/* Design Studio */}
          <Link to="/design-studio">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <Palette className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Design Studio</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Visual content creation with templates, brand assets, and export tools
                </p>
                <Badge className="bg-green-500">Complete</Badge>
              </CardContent>
            </Card>
          </Link>

          {/* Synapse - Breakthrough Content */}
          <Link to="/synapse">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full border-purple-500/50">
              <CardHeader>
                <TrendingUp className="h-8 w-8 text-purple-500 mb-2" />
                <CardTitle>Synapse</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  AI-powered breakthrough content discovery from real-time market intelligence
                </p>
                <Badge className="bg-purple-500">Demo</Badge>
              </CardContent>
            </Card>
          </Link>

          {/* Marbs AI */}
          <Card className="h-full border-primary/50">
            <CardHeader>
              <Sparkles className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Marbs AI</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Context-aware AI assistant available throughout the platform
              </p>
              <Badge className="bg-green-500">Active</Badge>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Development Status */}
      <section>
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Platform Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Phase 1: Database & Backend</span>
                <Badge className="bg-green-500">Complete</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Phase 2: Type System & Utilities</span>
                <Badge className="bg-green-500">Complete</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Phase 3: MARBA Framework</span>
                <Badge className="bg-green-500">Complete</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Phase 4: Major Features</span>
                <Badge className="bg-green-500">Complete</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Phase 5: UI Integration</span>
                <Badge className="bg-green-500">Complete</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Content Calendar System</span>
                <Badge className="bg-green-500">Live</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Analytics Dashboard</span>
                <Badge className="bg-green-500">Live</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Intelligence Hub</span>
                <Badge className="bg-green-500">Live</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Design Studio</span>
                <Badge className="bg-green-500">Live</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">API Management</span>
                <Badge className="bg-green-500">Live</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
      </div>
    </div>
  )
}
