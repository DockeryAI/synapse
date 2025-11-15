import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { IntentObjective, ObjectivesGenerator } from '@/services/mirror/objectives-generator'
import { Target, Trash2, Edit, Pause, Play, Save, X } from 'lucide-react'
import { SynapseLiveScoring } from '../reimagine/SynapseLiveScoring'

interface CustomGoalsProps {
  goals: IntentObjective[]
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onToggleStatus?: (id: string) => void
  onUpdate?: (id: string, updates: Partial<IntentObjective>) => void
  brandData?: any
  className?: string
}

export const CustomGoals: React.FC<CustomGoalsProps> = ({
  goals,
  onEdit,
  onDelete,
  onToggleStatus,
  onUpdate,
  brandData,
  className,
}) => {
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [editedGoal, setEditedGoal] = React.useState<Partial<IntentObjective>>({})

  const handleStartEdit = (goal: IntentObjective) => {
    setEditingId(goal.id!)
    setEditedGoal({ title: goal.title, description: goal.description })
  }

  const handleSaveEdit = (id: string) => {
    if (onUpdate) {
      onUpdate(id, editedGoal)
    }
    setEditingId(null)
    setEditedGoal({})
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditedGoal({})
  }
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <CardTitle>Active Goals</CardTitle>
          </div>
          <Badge variant="secondary">{goals.length} goals</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {goals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No active goals yet</p>
            <p className="text-sm">Create a goal or accept a recommended one</p>
          </div>
        ) : (
          goals.map((goal) => {
            const progress = ObjectivesGenerator.calculateProgress(goal)
            const isEditing = editingId === goal.id
            return (
              <Card key={goal.id} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {isEditing ? (
                        <div className="space-y-4">
                          <SynapseLiveScoring
                            value={editedGoal.title || ''}
                            onChange={(value) => setEditedGoal({ ...editedGoal, title: value })}
                            brandData={brandData}
                            placeholder="Goal title..."
                            label="Goal Title"
                            minScore={7}
                          />
                          <SynapseLiveScoring
                            value={editedGoal.description || ''}
                            onChange={(value) => setEditedGoal({ ...editedGoal, description: value })}
                            brandData={brandData}
                            placeholder="Goal description..."
                            label="Description"
                            minScore={7}
                          />
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{goal.title}</h4>
                            <Badge variant={goal.status === 'active' ? 'default' : 'secondary'}>
                              {goal.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{goal.description}</p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="font-medium">{goal.current_value}</span>
                      <span className="text-muted-foreground"> → </span>
                      <span className="font-medium text-green-600">{goal.target_value}</span>
                      <span className="text-muted-foreground"> {goal.unit}</span>
                    </div>
                    <Badge variant="outline">{ObjectivesGenerator.formatTimeline(goal.timeline)}</Badge>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t">
                    {isEditing ? (
                      <>
                        <Button variant="default" size="sm" onClick={() => handleSaveEdit(goal.id!)}>
                          <Save className="h-3 w-3 mr-1" /> Save
                        </Button>
                        <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                          <X className="h-3 w-3 mr-1" /> Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        {onToggleStatus && (
                          <Button variant="ghost" size="sm" onClick={() => onToggleStatus(goal.id!)}>
                            {goal.status === 'active' ? (
                              <><Pause className="h-3 w-3 mr-1" /> Pause</>
                            ) : (
                              <><Play className="h-3 w-3 mr-1" /> Resume</>
                            )}
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => handleStartEdit(goal)}>
                          <Edit className="h-3 w-3 mr-1" /> Edit
                        </Button>
                        {onDelete && (
                          <Button variant="ghost" size="sm" onClick={() => onDelete(goal.id!)}>
                            <Trash2 className="h-3 w-3 mr-1" /> Delete
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
