import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Palette, Type, MessageSquare, TrendingUp } from 'lucide-react'

interface BrandAssets {
  colors: string[]
  fonts: string[]
  messagingThemes: string[]
  contentPerformance: {
    totalPosts: number
    avgEngagement: number
    topFormat: string
  }
}

interface CurrentAssetsCardProps {
  assets: BrandAssets
  className?: string
}

export const CurrentAssetsCard: React.FC<CurrentAssetsCardProps> = ({
  assets,
  className,
}) => {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Current Assets</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Visual Identity */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Palette className="h-4 w-4" />
            <span>Brand Colors</span>
          </div>
          <div className="flex gap-2">
            {assets.colors.map((color, i) => (
              <div
                key={i}
                className="w-12 h-12 rounded-lg border shadow-sm"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>

        {/* Typography */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Type className="h-4 w-4" />
            <span>Typography</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {assets.fonts.map((font, i) => (
              <Badge key={i} variant="outline">
                {font}
              </Badge>
            ))}
          </div>
        </div>

        {/* Messaging Themes */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <MessageSquare className="h-4 w-4" />
            <span>Messaging Themes</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {assets.messagingThemes.map((theme, i) => (
              <Badge key={i} variant="secondary">
                {theme}
              </Badge>
            ))}
          </div>
        </div>

        {/* Content Performance */}
        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-center gap-2 text-sm font-medium">
            <TrendingUp className="h-4 w-4" />
            <span>Content Performance</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-lg bg-muted/50">
              <div className="text-lg font-bold">{assets.contentPerformance.totalPosts}</div>
              <div className="text-xs text-muted-foreground">Posts</div>
            </div>
            <div className="p-2 rounded-lg bg-muted/50">
              <div className="text-lg font-bold">{assets.contentPerformance.avgEngagement}%</div>
              <div className="text-xs text-muted-foreground">Avg Engagement</div>
            </div>
            <div className="p-2 rounded-lg bg-muted/50">
              <div className="text-xs font-medium truncate">{assets.contentPerformance.topFormat}</div>
              <div className="text-xs text-muted-foreground">Top Format</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
