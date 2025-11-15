/**
 * Mirror Moment Summary
 * The "So what?" - Top 3 critical gaps to fix with clear action items
 */

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import { type CriticalGap } from '@/types/mirror-diagnostics'
import { useNavigate } from 'react-router-dom'

interface MirrorMomentSummaryProps {
  gaps: CriticalGap[]
}

export const MirrorMomentSummary: React.FC<MirrorMomentSummaryProps> = ({ gaps }) => {
  const navigate = useNavigate()

  const handleFixAction = (fixActionLink: string) => {
    // Navigate to the fix action link
    if (fixActionLink.startsWith('/')) {
      navigate(fixActionLink)
    }
  }

  const getPriorityColor = (priority: 1 | 2 | 3) => {
    switch (priority) {
      case 1:
        return 'bg-red-100 text-red-800 border-red-300'
      case 2:
        return 'bg-orange-100 text-orange-800 border-orange-300'
      case 3:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getPriorityLabel = (priority: 1 | 2 | 3) => {
    switch (priority) {
      case 1:
        return 'Critical'
      case 2:
        return 'Important'
      case 3:
        return 'Recommended'
      default:
        return 'Priority ' + priority
    }
  }

  if (gaps.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader>
          <CardTitle className="text-green-700">No Critical Gaps Detected</CardTitle>
          <CardDescription>Your brand health is looking good!</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Continue monitoring your brand health and keep improving where possible.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-red-200 bg-gradient-to-br from-red-50/50 to-orange-50/50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-8 w-8 text-red-600" />
          <div>
            <CardTitle className="text-2xl">Your {gaps.length} Biggest Gaps to Fix</CardTitle>
            <CardDescription>
              These issues are holding your business back right now
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {gaps.map((gap, index) => (
          <Card
            key={index}
            className={`border-2 ${
              gap.priority === 1
                ? 'border-red-300'
                : gap.priority === 2
                  ? 'border-orange-300'
                  : 'border-yellow-300'
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getPriorityColor(gap.priority)} variant="outline">
                      {getPriorityLabel(gap.priority)}
                    </Badge>
                    <Badge variant="outline">Gap #{index + 1}</Badge>
                  </div>
                  <CardTitle className="text-lg">{gap.gap}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Impact */}
              <div className="bg-white/70 border rounded-lg p-3">
                <div className="text-sm font-semibold text-muted-foreground mb-1">
                  Why This Matters:
                </div>
                <p className="text-sm">{gap.impact}</p>
              </div>

              {/* Fix */}
              <div className="bg-white/70 border rounded-lg p-3">
                <div className="text-sm font-semibold text-muted-foreground mb-1">
                  How to Fix It:
                </div>
                <p className="text-sm">{gap.fix}</p>
              </div>

              {/* Action Button */}
              <Button
                onClick={() => handleFixAction(gap.fix_action_link)}
                className="w-full"
                variant={gap.priority === 1 ? 'default' : 'outline'}
              >
                {gap.priority === 1 ? 'Fix This Now' : 'Take Action'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}

        {/* Summary Message */}
        <div className="mt-6 p-4 bg-white border-2 border-blue-200 rounded-lg">
          <p className="text-sm text-center">
            <span className="font-semibold">Next Step: </span>
            Start with Gap #1 - it will have the biggest impact on your business. Once fixed, move
            to the next priority.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
