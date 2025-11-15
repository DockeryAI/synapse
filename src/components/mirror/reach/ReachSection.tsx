import * as React from 'react'
import { TacticsChannel } from './TacticsChannel'
import { ResourceAllocator } from './ResourceAllocator'
import { MirrorSectionHeader } from '@/components/layouts/MirrorLayout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TacticalChannel, TacticsPlanner, Tactic, ResourceAllocation } from '@/services/mirror/tactics-planner'
import { supabase } from '@/lib/supabase'
import { Sparkles, Target, DollarSign, Users, BarChart3 } from 'lucide-react'

interface ReachSectionProps {
  brandId: string
  strategy: any
  objectives: any[]
  budget: number
  teamSize: number
  className?: string
}

export const ReachSection: React.FC<ReachSectionProps> = ({
  brandId,
  strategy,
  objectives,
  budget,
  teamSize,
  className,
}) => {
  const [channels, setChannels] = React.useState<TacticalChannel[]>([])
  const [allocations, setAllocations] = React.useState<ResourceAllocation[]>([])
  const [activeTab, setActiveTab] = React.useState('overview')
  const [isGenerating, setIsGenerating] = React.useState(false)

  React.useEffect(() => {
    loadTactics()
  }, [brandId])

  React.useEffect(() => {
    if (strategy && objectives.length > 0 && channels.length === 0) {
      generateTactics()
    }
  }, [strategy, objectives])

  const loadTactics = async () => {
    try {
      const { data, error } = await supabase
        .from('tactical_plans')
        .select('*')
        .eq('brand_id', brandId)
        .maybeSingle()

      if (!error && data) {
        setChannels(data.channels)
        if (data.allocations) {
          setAllocations(data.allocations)
        }
      }
    } catch (error) {
      // Table may not exist yet - silently handle
      console.log('Tactical plans table not found - will generate from strategy')
    }
  }

  const generateTactics = async () => {
    setIsGenerating(true)
    try {
      const generated = TacticsPlanner.generateTactics({
        strategy,
        objectives,
        budget: budget || 10000,
        team_size: teamSize || 3,
        timeline: '90_days',
      })

      setChannels(generated)

      // Calculate resource allocations
      const allTactics: Tactic[] = generated.flatMap((c) => c.tactics)
      const resourceAllocations = TacticsPlanner.calculateResourceAllocation(
        allTactics,
        budget || 10000,
        teamSize * 160 // hours per month * team size
      )

      setAllocations(resourceAllocations)

      // Save to database
      await saveTactics(generated, resourceAllocations)
    } catch (error) {
      console.error('Failed to generate tactics:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const saveTactics = async (channelsData: TacticalChannel[], allocationsData: ResourceAllocation[]) => {
    try {
      await supabase.from('tactical_plans').upsert({
        brand_id: brandId,
        channels: channelsData,
        allocations: allocationsData,
        updated_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Failed to save tactics:', error)
    }
  }

  const handleToggleStep = async (tacticId: string, stepIndex: number) => {
    const updatedChannels = channels.map((channel) => ({
      ...channel,
      tactics: channel.tactics.map((tactic) => {
        if (tactic.id === tacticId) {
          const updatedSteps = [...tactic.steps]
          updatedSteps[stepIndex] = {
            ...updatedSteps[stepIndex],
            completed: !updatedSteps[stepIndex].completed,
          }
          return { ...tactic, steps: updatedSteps }
        }
        return tactic
      }),
    }))

    setChannels(updatedChannels)
    await saveTactics(updatedChannels, allocations)
  }

  const handleStatusChange = async (tacticId: string, status: Tactic['status']) => {
    const updatedChannels = channels.map((channel) => ({
      ...channel,
      tactics: channel.tactics.map((tactic) =>
        tactic.id === tacticId ? { ...tactic, status } : tactic
      ),
    }))

    setChannels(updatedChannels)
    await saveTactics(updatedChannels, allocations)
  }

  const allTactics = channels.flatMap((c) => c.tactics)
  const tacticsByStatus = {
    planned: allTactics.filter((t) => t.status === 'planned').length,
    in_progress: allTactics.filter((t) => t.status === 'in_progress').length,
    completed: allTactics.filter((t) => t.status === 'completed').length,
    paused: allTactics.filter((t) => t.status === 'paused').length,
  }

  const tacticNames = allTactics.reduce(
    (acc, tactic) => {
      acc[tactic.id] = tactic.name
      return acc
    },
    {} as Record<string, string>
  )

  return (
    <div className={className}>
      <MirrorSectionHeader
        title="Roadmap"
        description="Channels & campaigns — executable marketing tactics"
        badge={<span className="text-xs">MARBA Analysis | Campaigns</span>}
        actions={
          <Button size="sm" onClick={generateTactics} disabled={isGenerating}>
            <Sparkles className="h-4 w-4 mr-2" />
            {isGenerating ? 'Generating...' : 'Regenerate All'}
          </Button>
        }
      />

      <div className="container py-6 px-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-card rounded-lg border p-4 text-center">
            <div className="text-2xl font-bold">{allTactics.length}</div>
            <div className="text-xs text-muted-foreground">Total Tactics</div>
          </div>
          <div className="bg-card rounded-lg border p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{tacticsByStatus.in_progress}</div>
            <div className="text-xs text-muted-foreground">In Progress</div>
          </div>
          <div className="bg-card rounded-lg border p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{tacticsByStatus.completed}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
          <div className="bg-card rounded-lg border p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">{tacticsByStatus.planned}</div>
            <div className="text-xs text-muted-foreground">Planned</div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="channels" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              By Channel
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Resources
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6 space-y-4">
            {channels.length === 0 ? (
              <div className="text-center py-12">
                <Target className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p className="text-muted-foreground mb-2">No tactics generated yet</p>
                <p className="text-sm text-muted-foreground">
                  Click "Regenerate All" to create tactical plans based on your strategy
                </p>
              </div>
            ) : (
              <>
                {/* Channel Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {channels.map((channel) => (
                    <div key={channel.channel} className="bg-card rounded-lg border p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold">{channel.channel}</h3>
                        <Badge variant="secondary">{channel.priority}</Badge>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Tactics</span>
                          <span className="font-medium">{channel.tactics.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Budget</span>
                          <span className="font-medium">{channel.budget_allocation}%</span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full mt-2"
                          onClick={() => setActiveTab('channels')}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick Resource Overview */}
                {allocations.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    {allocations.map((allocation) => {
                      const utilizationPercent = (allocation.allocated / allocation.total_available) * 100
                      const isOverallocated = utilizationPercent > 100

                      return (
                        <div key={allocation.resource_type} className="bg-card rounded-lg border p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold capitalize">{allocation.resource_type}</h4>
                            <Badge variant={isOverallocated ? 'destructive' : 'secondary'}>
                              {utilizationPercent.toFixed(0)}%
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {allocation.allocated.toFixed(0)} / {allocation.total_available.toFixed(0)} allocated
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Channels Tab */}
          <TabsContent value="channels" className="mt-6 space-y-6">
            {channels.map((channel) => (
              <TacticsChannel
                key={channel.channel}
                channel={channel}
                onToggleStep={handleToggleStep}
                onStatusChange={handleStatusChange}
              />
            ))}
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources" className="mt-6">
            {allocations.length > 0 ? (
              <ResourceAllocator allocations={allocations} tacticNames={tacticNames} />
            ) : (
              <div className="text-center py-12">
                <DollarSign className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p className="text-muted-foreground">No resource allocations calculated yet</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
