/**
 * Performance Charts Component
 *
 * Comprehensive data visualization using Recharts for engagement trends, follower growth,
 * content type performance, platform comparison, and posting time analysis.
 *
 * Tasks: 435-443
 */

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { DateRange, Platform } from '@/types/analytics.types'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts'
import { Download, Calendar, TrendingUp } from 'lucide-react'
import { exportAnalyticsCSV, exportAnalyticsPDF } from '@/services/export'
import { toast } from 'sonner'

interface PerformanceChartsProps {
  brandId: string
  dateRange: DateRange
  className?: string
}

export const PerformanceCharts: React.FC<PerformanceChartsProps> = ({ brandId, dateRange, className }) => {
  const [dateRangePreset, setDateRangePreset] = React.useState<string>('30d')
  const [selectedChart, setSelectedChart] = React.useState<string>('engagement')
  const [metricsData, setMetricsData] = React.useState<any[]>([])

  const handleExportCSV = () => {
    try {
      // Export current chart data
      const filename = `performance-${selectedChart}-${dateRangePreset}`
      exportAnalyticsCSV(metricsData, filename)
      toast.success('CSV exported successfully')
    } catch (error) {
      console.error('CSV export failed:', error)
      toast.error('Failed to export CSV')
    }
  }

  const handleExportPDF = () => {
    try {
      // Export current chart data
      const title = `Performance Analytics - ${selectedChart}`
      const filename = `performance-${selectedChart}-${dateRangePreset}`
      exportAnalyticsPDF(metricsData, title, filename)
      toast.success('PDF export started (use browser print dialog)')
    } catch (error) {
      console.error('PDF export failed:', error)
      toast.error('Failed to export PDF')
    }
  }

  return (
    <div className={`${className} space-y-6`}>
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Performance Analytics</h3>
          <p className="text-sm text-muted-foreground">Visualize trends and patterns across all metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRangePreset} onValueChange={setDateRangePreset}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* Charts Tabs */}
      <Tabs value={selectedChart} onValueChange={setSelectedChart} className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="growth">Growth</TabsTrigger>
          <TabsTrigger value="content-type">Content Type</TabsTrigger>
          <TabsTrigger value="platform">Platform</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="multi-metric">Multi-Metric</TabsTrigger>
          <TabsTrigger value="timing">Timing</TabsTrigger>
        </TabsList>

        {/* Engagement Over Time */}
        <TabsContent value="engagement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Engagement Over Time</CardTitle>
              <CardDescription>Likes, comments, and shares trending over the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={generateEngagementData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                    }}
                  />
                  <Legend />
                  <ReferenceLine
                    y={500}
                    stroke="#9ca3af"
                    strokeDasharray="3 3"
                    label={{ value: 'Industry Avg', position: 'right', fill: '#6b7280' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="likes"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="comments"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: '#10b981', r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="shares"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ fill: '#f59e0b', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Follower Growth */}
        <TabsContent value="growth" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Follower Growth</CardTitle>
              <CardDescription>Total followers and growth rate over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={generateGrowthData()}>
                  <defs>
                    <linearGradient id="colorFollowers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="followers"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorFollowers)"
                  />
                  <Line
                    type="monotone"
                    dataKey="growthRate"
                    stroke="#10b981"
                    strokeWidth={2}
                    yAxisId="right"
                    dot={false}
                  />
                  <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={12} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Type Performance */}
        <TabsContent value="content-type" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance by Content Type</CardTitle>
              <CardDescription>Average engagement by content format</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={generateContentTypeData()} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" stroke="#6b7280" fontSize={12} />
                  <YAxis dataKey="type" type="category" stroke="#6b7280" fontSize={12} width={120} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="engagement" radius={[0, 8, 8, 0]}>
                    {generateContentTypeData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getBarColor(index)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Platform Comparison */}
        <TabsContent value="platform" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Platform Comparison</CardTitle>
              <CardDescription>Engagement metrics across social platforms</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={generatePlatformData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="platform" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="engagement" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="reach" fill="#10b981" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="conversions" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Platform Distribution Pie Chart */}
        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Platform Content Distribution</CardTitle>
              <CardDescription>Percentage of content published per platform</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={generatePlatformDistribution()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {generatePlatformDistribution().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Multi-Metric Composed Chart */}
        <TabsContent value="multi-metric" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Multi-Metric Performance</CardTitle>
              <CardDescription>Combined view of impressions, engagement, and clicks over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={generateMultiMetricData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                  <YAxis yAxisId="left" stroke="#6b7280" fontSize={12} />
                  <YAxis yAxisId="right" orientation="right" stroke="#6b7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                    }}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="impressions" fill="#93c5fd" radius={[8, 8, 0, 0]} />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="engagement"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 4 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="clicks"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: '#10b981', r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Posting Time Performance */}
        <TabsContent value="timing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Best Times to Post</CardTitle>
              <CardDescription>Average engagement by day of week and hour</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={generateTimingData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                    }}
                    formatter={(value: any, name: string) => {
                      if (name === 'morning') return [`${value}`, 'Morning (6am-12pm)']
                      if (name === 'afternoon') return [`${value}`, 'Afternoon (12pm-6pm)']
                      if (name === 'evening') return [`${value}`, 'Evening (6pm-12am)']
                      return [value, name]
                    }}
                  />
                  <Legend
                    formatter={(value) => {
                      if (value === 'morning') return 'Morning (6am-12pm)'
                      if (value === 'afternoon') return 'Afternoon (12pm-6pm)'
                      if (value === 'evening') return 'Evening (6pm-12am)'
                      return value
                    }}
                  />
                  <Bar dataKey="morning" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="afternoon" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="evening" stackId="a" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Detailed Heatmap Card */}
          <Card>
            <CardHeader>
              <CardTitle>Engagement Heatmap</CardTitle>
              <CardDescription>Hour-by-hour engagement patterns throughout the week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                  <div key={day} className="flex items-center gap-2">
                    <span className="text-xs font-medium w-8">{day}</span>
                    <div className="flex-1 flex gap-1">
                      {Array.from({ length: 24 }, (_, hour) => {
                        const intensity = getHeatmapIntensity(day, hour)
                        return (
                          <div
                            key={hour}
                            className="flex-1 h-6 rounded transition-colors cursor-pointer hover:opacity-80"
                            style={{
                              backgroundColor: getHeatmapColor(intensity),
                            }}
                            title={`${day} ${hour}:00 - ${intensity}% engagement`}
                          />
                        )
                      })}
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between text-xs text-muted-foreground mt-4">
                  <span>Less engaged</span>
                  <div className="flex gap-1">
                    {[0, 25, 50, 75, 100].map((val) => (
                      <div
                        key={val}
                        className="w-6 h-6 rounded"
                        style={{ backgroundColor: getHeatmapColor(val) }}
                      />
                    ))}
                  </div>
                  <span>More engaged</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ==================== Sample Data Generators ====================

function generateEngagementData() {
  const data = []
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30)

  for (let i = 0; i < 30; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      likes: Math.floor(300 + Math.random() * 400 + i * 10),
      comments: Math.floor(50 + Math.random() * 80 + i * 2),
      shares: Math.floor(20 + Math.random() * 40 + i * 1),
    })
  }
  return data
}

function generateGrowthData() {
  const data = []
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30)
  let followers = 10000

  for (let i = 0; i < 30; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    const growth = Math.floor(50 + Math.random() * 100)
    followers += growth
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      followers,
      growthRate: ((growth / followers) * 100).toFixed(2),
    })
  }
  return data
}

function generateContentTypeData() {
  return [
    { type: 'Video', engagement: 1247, posts: 12 },
    { type: 'Image Carousel', engagement: 985, posts: 18 },
    { type: 'Single Image', engagement: 842, posts: 24 },
    { type: 'Text Post', engagement: 623, posts: 15 },
    { type: 'Story', engagement: 534, posts: 30 },
    { type: 'Reel', engagement: 1456, posts: 8 },
  ]
}

function generatePlatformData() {
  return [
    { platform: 'Instagram', engagement: 1247, reach: 45000, conversions: 43 },
    { platform: 'Twitter', engagement: 856, reach: 32000, conversions: 28 },
    { platform: 'LinkedIn', engagement: 623, reach: 18000, conversions: 52 },
    { platform: 'Facebook', engagement: 534, reach: 25000, conversions: 31 },
  ]
}

function generateTimingData() {
  return [
    { day: 'Mon', morning: 420, afternoon: 580, evening: 340 },
    { day: 'Tue', morning: 450, afternoon: 620, evening: 380 },
    { day: 'Wed', morning: 480, afternoon: 720, evening: 420 },
    { day: 'Thu', morning: 460, afternoon: 680, evening: 390 },
    { day: 'Fri', morning: 440, afternoon: 650, evening: 520 },
    { day: 'Sat', morning: 320, afternoon: 480, evening: 580 },
    { day: 'Sun', morning: 280, afternoon: 420, evening: 540 },
  ]
}

function getBarColor(index: number): string {
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
  return colors[index % colors.length]
}

function getHeatmapIntensity(day: string, hour: number): number {
  // Simulate realistic engagement patterns
  const dayIndex = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(day)
  const isWeekend = dayIndex >= 5

  // Peak hours: 9am, 12pm, 6pm
  let base = 20
  if (hour >= 8 && hour <= 20) base = 40
  if (hour === 9 || hour === 12 || hour === 18) base = 80
  if (isWeekend) base *= 0.7

  return Math.min(100, base + Math.random() * 20)
}

function getHeatmapColor(intensity: number): string {
  // Blue gradient based on intensity
  if (intensity === 0) return '#f3f4f6'
  if (intensity < 25) return '#dbeafe'
  if (intensity < 50) return '#93c5fd'
  if (intensity < 75) return '#3b82f6'
  return '#1e40af'
}

function generatePlatformDistribution() {
  return [
    { name: 'Instagram', value: 35, color: '#e1306c' },
    { name: 'Twitter', value: 25, color: '#1da1f2' },
    { name: 'LinkedIn', value: 20, color: '#0077b5' },
    { name: 'Facebook', value: 15, color: '#1877f2' },
    { name: 'TikTok', value: 5, color: '#000000' },
  ]
}

function generateMultiMetricData() {
  const data = []
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30)

  for (let i = 0; i < 30; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      impressions: Math.floor(15000 + Math.random() * 10000 + i * 300),
      engagement: Math.floor(800 + Math.random() * 400 + i * 15),
      clicks: Math.floor(200 + Math.random() * 150 + i * 5),
    })
  }
  return data
}

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="font-semibold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}
