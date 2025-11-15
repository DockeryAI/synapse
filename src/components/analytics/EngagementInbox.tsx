/**
 * Engagement Inbox Component
 *
 * Display and manage social media engagement (comments, mentions, messages)
 * with sentiment indicators, priority flagging, AI-suggested responses, and filtering.
 *
 * Tasks: 460-468
 */

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AnalyticsService } from '@/services/analytics/analytics.service'
import type { EngagementItem, ResponseSuggestion, InboxFilters } from '@/types/analytics.types'
import { MessageCircle, Search, Filter, Sparkles, Send, Check, Archive } from 'lucide-react'

interface EngagementInboxProps {
  brandId: string
  className?: string
}

export const EngagementInbox: React.FC<EngagementInboxProps> = ({ brandId, className }) => {
  const [items, setItems] = React.useState<EngagementItem[]>([])
  const [filters, setFilters] = React.useState<InboxFilters>({})
  const [selectedItem, setSelectedItem] = React.useState<EngagementItem | null>(null)
  const [suggestions, setSuggestions] = React.useState<ResponseSuggestion[]>([])
  const [replyText, setReplyText] = React.useState('')
  const [searchQuery, setSearchQuery] = React.useState('')

  React.useEffect(() => {
    loadEngagements()
  }, [brandId, filters])

  const loadEngagements = async () => {
    try {
      const data = await AnalyticsService.getEngagementInbox(brandId, { ...filters, searchQuery })
      setItems(data)
    } catch (error) {
      console.error('Error loading engagements:', error)
    }
  }

  const handleSelectItem = async (item: EngagementItem) => {
    setSelectedItem(item)
    const sug = await AnalyticsService.suggestResponse(item)
    setSuggestions(sug)
  }

  const handleMarkAsRead = async (itemId: string) => {
    await AnalyticsService.markAsRead(itemId)
    loadEngagements()
  }

  const getSentimentIcon = (sentiment: EngagementItem['sentiment']) => {
    if (sentiment === 'positive') return '😊'
    if (sentiment === 'negative') return '😞'
    return '😐'
  }

  const getPriorityColor = (priority: EngagementItem['priority']) => {
    if (priority === 'high') return 'bg-red-100 border-red-300 text-red-900'
    if (priority === 'medium') return 'bg-yellow-100 border-yellow-300 text-yellow-900'
    return 'bg-gray-100 border-gray-300'
  }

  return (
    <div className={`${className} grid grid-cols-1 lg:grid-cols-3 gap-6`}>
      {/* Inbox List */}
      <div className="lg:col-span-2 space-y-4">
        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-2 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search engagements..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button variant="outline" onClick={loadEngagements}>
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <Select value={filters.platform || 'all'} onValueChange={(v) => setFilters({ ...filters, platform: v === 'all' ? undefined : v as any })}>
                <SelectTrigger><SelectValue placeholder="Platform" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="twitter">Twitter</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.sentiment || 'all'} onValueChange={(v) => setFilters({ ...filters, sentiment: v === 'all' ? undefined : v as any })}>
                <SelectTrigger><SelectValue placeholder="Sentiment" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sentiment</SelectItem>
                  <SelectItem value="positive">Positive</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                  <SelectItem value="negative">Negative</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.priority || 'all'} onValueChange={(v) => setFilters({ ...filters, priority: v === 'all' ? undefined : v as any })}>
                <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.status || 'all'} onValueChange={(v) => setFilters({ ...filters, status: v === 'all' ? undefined : v as any })}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="responded">Responded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Engagement Items */}
        <div className="space-y-2">
          {items.map((item) => (
            <Card
              key={item.id}
              className={`cursor-pointer transition-all hover:shadow-md border-2 ${getPriorityColor(item.priority)} ${selectedItem?.id === item.id ? 'ring-2 ring-primary' : ''}`}
              onClick={() => handleSelectItem(item)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{getSentimentIcon(item.sentiment)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{item.author}</span>
                      <Badge variant="outline" className="text-xs">{item.platform}</Badge>
                      <Badge variant="outline" className="text-xs">{item.type}</Badge>
                      {item.priority === 'high' && <Badge variant="destructive" className="text-xs">High Priority</Badge>}
                    </div>
                    <p className="text-sm line-clamp-2">{item.content}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{new Date(item.createdAt).toLocaleString()}</span>
                      {item.status === 'responded' && <Badge variant="secondary"><Check className="h-3 w-3 mr-1" />Responded</Badge>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Response Panel */}
      <div className="space-y-4">
        {selectedItem ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick Reply</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="Type your response..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={4}
                />
                <div className="flex gap-2">
                  <Button className="flex-1">
                    <Send className="h-4 w-4 mr-2" />
                    Send
                  </Button>
                  <Button variant="outline" onClick={() => handleMarkAsRead(selectedItem.id)}>
                    <Archive className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {suggestions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    AI Suggestions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {suggestions.map((sug) => (
                    <div
                      key={sug.id}
                      className="p-3 rounded-lg border cursor-pointer hover:bg-muted"
                      onClick={() => setReplyText(sug.text)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="outline" className="text-xs">{sug.tone}</Badge>
                        <span className="text-xs text-muted-foreground">{(sug.confidence * 100).toFixed(0)}%</span>
                      </div>
                      <p className="text-sm">{sug.text}</p>
                      <p className="text-xs text-muted-foreground mt-1">{sug.reason}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">Select an engagement to respond</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
