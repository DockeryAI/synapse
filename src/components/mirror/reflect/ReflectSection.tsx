import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { KPIDashboard } from './KPIDashboard'
import { PerformanceInsights } from './PerformanceInsights'
import { GoalProgressTracker } from '@/components/analytics/GoalProgressTracker'
import { KPIScorecard } from '@/components/analytics/KPIScorecard'
import { PerformanceCharts } from '@/components/analytics/PerformanceCharts'
import { ContentAnalytics } from '@/components/analytics/ContentAnalytics'
import { AudienceInsights } from '@/components/analytics/AudienceInsights'
import { EngagementInbox } from '@/components/analytics/EngagementInbox'
import { LearningEngineWidget } from './LearningEngineWidget'
import { BenchmarkComparison } from './BenchmarkComparison'
import { CompetitiveMonitoring } from '@/components/analytics/CompetitiveMonitoring'
import {
  ReflectDashboard,
  KPIMetric,
  PerformanceInsight,
  ReflectionReport,
} from '@/services/mirror/reflect-dashboard'
import { exportMIRRORSectionCSV, exportMIRRORSectionPDF } from '@/services/export'
import { toast } from 'sonner'
import {
  BarChart3,
  TrendingUp,
  FileText,
  Download,
  RefreshCw,
  Target,
  Lightbulb,
  Users,
  MessageCircle,
  Brain,
  Eye,
  LineChart,
  FileBarChart,
} from 'lucide-react'

interface ReflectSectionProps {
  objectives?: any[]
  className?: string
  brandId?: string
  brandHealth?: number  // Real brand health score from MIRROR Measure section
}

export const ReflectSection: React.FC<ReflectSectionProps> = ({ objectives = [], className, brandId, brandHealth }) => {
  const [kpis, setKPIs] = React.useState<KPIMetric[]>([])
  const [insights, setInsights] = React.useState<PerformanceInsight[]>([])
  const [report, setReport] = React.useState<ReflectionReport | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)

  // Generate KPIs and insights from objectives
  React.useEffect(() => {
    if (objectives.length > 0) {
      generateReflectionData()
    }
  }, [objectives])

  const generateReflectionData = () => {
    setIsLoading(true)
    try {
      // Generate KPIs from objectives
      const generatedKPIs = ReflectDashboard.generateKPIMetrics(objectives)
      setKPIs(generatedKPIs)

      // Analyze performance and generate insights
      const generatedInsights = ReflectDashboard.analyzePerformance(generatedKPIs)
      setInsights(generatedInsights)

      // Generate full reflection report
      const generatedReport = ReflectDashboard.generateReflectionReport(generatedKPIs)
      setReport(generatedReport)
    } catch (error) {
      console.error('Error generating reflection data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportReport = () => {
    if (!report) return

    const dataStr = ReflectDashboard.exportReportData(report)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `mirror-reflection-report-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleExportSummary = () => {
    if (!report) return

    const summary = ReflectDashboard.generateExecutiveSummary(report)
    const dataBlob = new Blob([summary], { type: 'text/markdown' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `mirror-executive-summary-${new Date().toISOString().split('T')[0]}.md`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleExportCSV = () => {
    if (!report) return

    try {
      exportMIRRORSectionCSV('reflect', report, 'Brand')
      toast.success('CSV exported successfully')
    } catch (error) {
      console.error('CSV export failed:', error)
      toast.error('Failed to export CSV')
    }
  }

  const handleExportPDF = () => {
    if (!report) return

    try {
      exportMIRRORSectionPDF('reflect', report, 'Brand')
      toast.success('PDF export started (use browser print dialog)')
    } catch (error) {
      console.error('PDF export failed:', error)
      toast.error('Failed to export PDF')
    }
  }

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Reflect & Review</h2>
            <p className="text-muted-foreground">
              Review outcomes, analyze results, and feed insights back into the MIRROR cycle
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={generateReflectionData}
              disabled={isLoading || objectives.length === 0}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
          </div>
        </div>

        {/* Overall Score Card */}
        {report && (
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Overall Performance Score</span>
                <Badge className="text-lg px-4 py-2">
                  {report.overall_score}/100
                </Badge>
              </CardTitle>
              <CardDescription>
                {report.period} Performance Summary
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {report.kpi_summary.exceeding}
                  </div>
                  <div className="text-xs text-muted-foreground">Exceeding</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {report.kpi_summary.on_track}
                  </div>
                  <div className="text-xs text-muted-foreground">On Track</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {report.kpi_summary.at_risk}
                  </div>
                  <div className="text-xs text-muted-foreground">At Risk</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {report.kpi_summary.critical}
                  </div>
                  <div className="text-xs text-muted-foreground">Critical</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{report.kpi_summary.total_kpis}</div>
                  <div className="text-xs text-muted-foreground">Total KPIs</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        {objectives.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Performance Data Available</CardTitle>
              <CardDescription>
                Set objectives in the Intend phase to start tracking and reviewing performance
              </CardDescription>
            </CardHeader>
            <CardContent className="py-12 text-center">
              <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                Once you define your marketing objectives, this section will automatically generate:
              </p>
              <ul className="text-sm text-muted-foreground mt-4 space-y-2 inline-block text-left">
                <li className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  KPI tracking dashboards
                </li>
                <li className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Performance insights and recommendations
                </li>
                <li className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Comprehensive reflection reports
                </li>
              </ul>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="goals" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-10">
              <TabsTrigger value="goals">
                <Target className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Goals</span>
              </TabsTrigger>
              <TabsTrigger value="kpis">
                <BarChart3 className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">KPIs</span>
              </TabsTrigger>
              <TabsTrigger value="benchmarks">
                <TrendingUp className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Benchmarks</span>
              </TabsTrigger>
              <TabsTrigger value="performance">
                <LineChart className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Performance</span>
              </TabsTrigger>
              <TabsTrigger value="content">
                <FileBarChart className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Content</span>
              </TabsTrigger>
              <TabsTrigger value="audience">
                <Users className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Audience</span>
              </TabsTrigger>
              <TabsTrigger value="engagement">
                <MessageCircle className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Engagement</span>
              </TabsTrigger>
              <TabsTrigger value="learning">
                <Brain className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Learning</span>
              </TabsTrigger>
              <TabsTrigger value="competitive">
                <Eye className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Competitive</span>
              </TabsTrigger>
              <TabsTrigger value="report">
                <FileText className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Report</span>
              </TabsTrigger>
            </TabsList>

            {/* Goal Progress Tab */}
            <TabsContent value="goals" className="space-y-4">
              <GoalProgressTracker brandId="demo-brand" objectives={objectives} />
            </TabsContent>

            {/* KPI Dashboard Tab */}
            <TabsContent value="kpis" className="space-y-4">
              <KPIScorecard
                brandId={brandId || 'demo-brand'}
                dateRange={{ start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), end: new Date().toISOString(), preset: '30d' }}
                brandHealth={brandHealth}
              />
            </TabsContent>

            {/* Industry Benchmarks Tab */}
            <TabsContent value="benchmarks" className="space-y-4">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Industry Benchmark Comparison</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    See how your metrics compare against industry averages and top performers
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <BenchmarkComparison
                    metricName="Engagement Rate"
                    yourValue={4.8}
                    industryAvg={3.5}
                    topTenPercent={6.2}
                    format="percentage"
                    improvement="+0.5%"
                    goal={5.5}
                  />
                  <BenchmarkComparison
                    metricName="Follower Growth Rate"
                    yourValue={8.3}
                    industryAvg={5.2}
                    topTenPercent={12.0}
                    format="percentage"
                    improvement="+1.2%"
                  />
                  <BenchmarkComparison
                    metricName="Content Performance Score"
                    yourValue={82}
                    industryAvg={75}
                    topTenPercent={90}
                    format="number"
                    improvement="+3"
                    goal={90}
                  />
                  <BenchmarkComparison
                    metricName="Click-Through Rate"
                    yourValue={2.4}
                    industryAvg={1.8}
                    topTenPercent={3.5}
                    format="percentage"
                    improvement="+0.3%"
                  />
                  <BenchmarkComparison
                    metricName="Conversion Rate"
                    yourValue={3.2}
                    industryAvg={2.1}
                    topTenPercent={5.8}
                    format="percentage"
                    goal={4.0}
                  />
                  <BenchmarkComparison
                    metricName="Average Response Time"
                    yourValue={45}
                    industryAvg={120}
                    topTenPercent={30}
                    unit=" min"
                    format="number"
                    improvement="-15 min"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Performance Charts Tab */}
            <TabsContent value="performance" className="space-y-4">
              <PerformanceCharts
                brandId="demo-brand"
                dateRange={{ start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), end: new Date().toISOString(), preset: '30d' }}
              />
            </TabsContent>

            {/* Content Analytics Tab */}
            <TabsContent value="content" className="space-y-4">
              <ContentAnalytics
                brandId="demo-brand"
                dateRange={{ start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), end: new Date().toISOString(), preset: '30d' }}
              />
            </TabsContent>

            {/* Audience Insights Tab */}
            <TabsContent value="audience" className="space-y-4">
              <AudienceInsights brandId="demo-brand" />
            </TabsContent>

            {/* Engagement Inbox Tab */}
            <TabsContent value="engagement" className="space-y-4">
              <EngagementInbox brandId="demo-brand" />
            </TabsContent>

            {/* Learning Engine Tab */}
            <TabsContent value="learning" className="space-y-4">
              <LearningEngineWidget brandId="demo-brand" />
            </TabsContent>

            {/* Competitive Monitoring Tab */}
            <TabsContent value="competitive" className="space-y-4">
              <CompetitiveMonitoring brandId="demo-brand" />
            </TabsContent>

            {/* Full Report Tab */}
            <TabsContent value="report" className="space-y-4">
              {report && (
                <>
                  {/* Strategic Recommendations */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Strategic Recommendations</CardTitle>
                        <Button variant="outline" size="sm" onClick={handleExportSummary}>
                          <Download className="h-4 w-4 mr-2" />
                          Export Summary
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {report.strategic_recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                              {index + 1}
                            </span>
                            <span className="text-sm">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  {/* Next Cycle Priorities */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Next Cycle Priorities</CardTitle>
                      <CardDescription>
                        Focus areas for the next MIRROR cycle
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {report.next_cycle_priorities.map((priority, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-2 p-3 rounded-lg border bg-muted/50"
                          >
                            <TrendingUp className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                            <span className="text-sm">{priority}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Export Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Export Options</CardTitle>
                      <CardDescription>
                        Download complete performance data and reports
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-3">
                        <Button onClick={handleExportReport}>
                          <Download className="h-4 w-4 mr-2" />
                          Export Full Report (JSON)
                        </Button>
                        <Button variant="outline" onClick={handleExportSummary}>
                          <FileText className="h-4 w-4 mr-2" />
                          Export Executive Summary (MD)
                        </Button>
                        <Button variant="outline" onClick={handleExportCSV}>
                          <Download className="h-4 w-4 mr-2" />
                          Export CSV
                        </Button>
                        <Button variant="outline" onClick={handleExportPDF}>
                          <FileText className="h-4 w-4 mr-2" />
                          Export PDF
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
