/**
 * Content Calendar Page
 * Full page wrapper for the Content Calendar Hub
 */

import * as React from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { ContentCalendarHub } from '@/components/content-calendar/ContentCalendarHub'
import type { ContentPillar } from '@/types/content-calendar.types'

export const ContentCalendarPage: React.FC = () => {
  // TODO: Get from BrandContext when implemented
  // Using real brand ID from database
  const brandId = 'f2a18c4f-ade8-43f8-bff3-5832d3ced7aa' // harwoodarmsdallas.com
  const userId = 'demo-user-123'

  // TODO: Load from Supabase when implemented
  const pillars: ContentPillar[] = [
    {
      id: 'pillar-1',
      brand_id: brandId,
      name: 'Educational Content',
      description: 'Tips, tutorials, and how-to guides',
      color: '#3B82F6',
      synapse_score: 85,
    },
    {
      id: 'pillar-2',
      brand_id: brandId,
      name: 'Promotional',
      description: 'Product features and special offers',
      color: '#10B981',
      synapse_score: 78,
    },
    {
      id: 'pillar-3',
      brand_id: brandId,
      name: 'Engagement',
      description: 'Questions, polls, and community building',
      color: '#F59E0B',
      synapse_score: 92,
    },
  ]

  return (
    <AppLayout showBreadcrumbs={true}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Content Calendar</h1>
          <p className="text-muted-foreground">
            Plan, create, schedule, and publish your content across all platforms
          </p>
        </div>

        <ContentCalendarHub
          brandId={brandId}
          userId={userId}
          pillars={pillars}
        />
      </div>
    </AppLayout>
  )
}
