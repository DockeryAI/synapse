import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MarketPosition } from '@/services/mirror/situation-analyzer'
import { Target, Users, MapPin, Sparkles } from 'lucide-react'

interface MarketPositionCardProps {
  position: MarketPosition
  className?: string
}

export const MarketPositionCard: React.FC<MarketPositionCardProps> = ({
  position,
  className,
}) => {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Market Position</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <PositionItem
          icon={<Target className="h-4 w-4" />}
          label="Industry"
          value={position.industry}
        />
        <PositionItem
          icon={<Users className="h-4 w-4" />}
          label="Target Audience"
          value={position.targetAudience}
        />
        <PositionItem
          icon={<MapPin className="h-4 w-4" />}
          label="Geographic Reach"
          value={position.geographicReach}
        />
        <div className="pt-2 border-t">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Brand Archetype</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="default" className="text-sm">
              {position.primaryArchetype}
            </Badge>
            {position.secondaryArchetype && (
              <Badge variant="secondary" className="text-sm">
                {position.secondaryArchetype}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const PositionItem: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({
  icon,
  label,
  value,
}) => (
  <div className="flex items-start gap-3">
    <div className="p-2 rounded-lg bg-muted text-muted-foreground">{icon}</div>
    <div className="flex-1">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  </div>
)
