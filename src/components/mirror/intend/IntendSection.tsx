import * as React from 'react'
import { GoalBuilder } from './GoalBuilder'
import { RecommendedGoals } from './RecommendedGoals'
import { CustomGoals } from './CustomGoals'
import { WWHFramework } from './WWHFramework'
import { IntentObjective } from '@/services/mirror/objectives-generator'
import { MirrorSectionHeader } from '@/components/layouts/MirrorLayout'
import { supabase } from '@/lib/supabase'

interface IntendSectionProps {
  brandId: string
  situationData: { brandHealth: number; industry: string; currentMetrics: Record<string, number> }
  brandData?: any
  className?: string
}

export const IntendSection: React.FC<IntendSectionProps> = ({
  brandId,
  situationData,
  brandData,
  className,
}) => {
  const [goals, setGoals] = React.useState<IntentObjective[]>([])
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    loadGoals()
  }, [brandId])

  const loadGoals = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('mirror_objectives')
        .select('*')
        .eq('brand_id', brandId)
        .eq('status', 'active')

      if (!error && data) {
        setGoals(data as IntentObjective[])
      }
    } catch (error) {
      // Table may not exist yet - silently handle
      console.log('Mirror objectives table not found - using default goals')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveGoal = async (objective: IntentObjective) => {
    try {
      const { error } = await supabase.from('mirror_objectives').insert({
        ...objective,
        brand_id: brandId,
        created_at: new Date().toISOString(),
      })

      if (!error) {
        await loadGoals()
      }
    } catch (error) {
      console.error('Failed to save goal:', error)
    }
  }

  const handleDeleteGoal = async (id: string) => {
    try {
      const { error } = await supabase
        .from('mirror_objectives')
        .delete()
        .eq('id', id)

      if (!error) {
        await loadGoals()
      }
    } catch (error) {
      console.error('Failed to delete goal:', error)
    }
  }

  const handleToggleStatus = async (id: string) => {
    const goal = goals.find((g) => g.id === id)
    if (!goal) return

    const newStatus = goal.status === 'active' ? 'paused' : 'active'

    try {
      const { error } = await supabase
        .from('mirror_objectives')
        .update({ status: newStatus })
        .eq('id', id)

      if (!error) {
        await loadGoals()
      }
    } catch (error) {
      console.error('Failed to toggle status:', error)
    }
  }

  const handleUpdateGoal = async (id: string, updates: Partial<IntentObjective>) => {
    try {
      const { error } = await supabase
        .from('mirror_objectives')
        .update(updates)
        .eq('id', id)

      if (!error) {
        await loadGoals()
      }
    } catch (error) {
      console.error('Failed to update goal:', error)
    }
  }

  return (
    <div className={className}>
      <MirrorSectionHeader
        title="Align"
        description="Set your direction — goals, results, and what success looks like"
        badge={<span className="text-xs">MARBA Analysis</span>}
      />

      <div className="container py-6 px-6 space-y-8">
        {/* WWH Framework (Why, What, How) */}
        <section id="wwh-framework" className="scroll-mt-20">
          <WWHFramework brandData={brandData} />
        </section>

        {/* Recommended Goals */}
        <RecommendedGoals
          situationData={situationData}
          onAccept={handleSaveGoal}
        />

        {/* Goal Builder */}
        <GoalBuilder onSave={handleSaveGoal} brandData={brandData} />

        {/* Active Goals */}
        <CustomGoals
          goals={goals}
          onDelete={handleDeleteGoal}
          onToggleStatus={handleToggleStatus}
          onUpdate={handleUpdateGoal}
          brandData={brandData}
        />
      </div>
    </div>
  )
}
