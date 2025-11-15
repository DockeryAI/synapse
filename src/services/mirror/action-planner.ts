/**
 * Action Planner Service
 * Converts tactics into concrete action items with ownership and deadlines
 */

export interface ActionItem {
  id: string
  title: string
  description: string
  tactic_id?: string
  owner?: string
  status: 'not_started' | 'in_progress' | 'blocked' | 'completed' | 'cancelled'
  priority: 'critical' | 'high' | 'medium' | 'low'
  due_date: string
  completed_date?: string
  estimated_hours: number
  actual_hours?: number
  dependencies: string[]
  tags: string[]
  checklist: ChecklistItem[]
  notes: string
  created_at: string
}

export interface ChecklistItem {
  id: string
  text: string
  completed: boolean
  order: number
}

export interface ActionTimeline {
  week: string
  actions: ActionItem[]
  capacity_hours: number
  allocated_hours: number
}

export interface TeamMember {
  id: string
  name: string
  role: string
  capacity_hours_per_week: number
  skills: string[]
  current_workload: number
}

export interface ActionDependencyGraph {
  nodes: ActionNode[]
  edges: ActionEdge[]
}

export interface ActionNode {
  id: string
  action: ActionItem
  x: number
  y: number
}

export interface ActionEdge {
  from: string
  to: string
  type: 'blocks' | 'enables' | 'related'
}

export class ActionPlanner {
  /**
   * Generate action items from tactics
   */
  static generateActionsFromTactics(tactics: any[]): ActionItem[] {
    const actions: ActionItem[] = []

    tactics.forEach((tactic) => {
      if (tactic.steps && Array.isArray(tactic.steps)) {
        tactic.steps.forEach((step: any, index: number) => {
          actions.push({
            id: `action-${tactic.id}-${index}`,
            title: step.action,
            description: `Part of ${tactic.name} tactic`,
            tactic_id: tactic.id,
            owner: step.owner,
            status: step.completed ? 'completed' : 'not_started',
            priority: this.determinePriority(tactic.expected_impact, tactic.urgency),
            due_date: this.calculateDueDate(tactic.timeline, index, tactic.steps.length),
            estimated_hours: step.duration_hours || 4,
            dependencies: index > 0 ? [`action-${tactic.id}-${index - 1}`] : [],
            tags: [tactic.type, tactic.channel],
            checklist: [],
            notes: '',
            created_at: new Date().toISOString(),
          })
        })
      }
    })

    return actions
  }

  /**
   * Determine action priority based on impact and urgency
   */
  private static determinePriority(
    impact: 'low' | 'medium' | 'high',
    urgency?: 'low' | 'medium' | 'high'
  ): 'critical' | 'high' | 'medium' | 'low' {
    if (impact === 'high' && urgency === 'high') return 'critical'
    if (impact === 'high' || urgency === 'high') return 'high'
    if (impact === 'medium') return 'medium'
    return 'low'
  }

  /**
   * Calculate due date based on tactic timeline
   */
  private static calculateDueDate(timeline: string, stepIndex: number, totalSteps: number): string {
    const today = new Date()
    let daysToAdd = 7 // Default to 1 week

    if (timeline.includes('30')) daysToAdd = 30
    else if (timeline.includes('60')) daysToAdd = 60
    else if (timeline.includes('90')) daysToAdd = 90
    else if (timeline.includes('6')) daysToAdd = 180
    else if (timeline.includes('year')) daysToAdd = 365

    // Distribute across timeline
    const daysPerStep = daysToAdd / totalSteps
    const stepDays = Math.round(daysPerStep * (stepIndex + 1))

    const dueDate = new Date(today)
    dueDate.setDate(today.getDate() + stepDays)

    return dueDate.toISOString().split('T')[0]
  }

  /**
   * Create weekly timeline from actions
   */
  static createWeeklyTimeline(actions: ActionItem[], weeks: number = 12): ActionTimeline[] {
    const timeline: ActionTimeline[] = []
    const today = new Date()

    for (let i = 0; i < weeks; i++) {
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() + i * 7)

      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)

      const weekActions = actions.filter((action) => {
        const dueDate = new Date(action.due_date)
        return dueDate >= weekStart && dueDate <= weekEnd
      })

      const allocatedHours = weekActions.reduce((sum, action) => sum + action.estimated_hours, 0)

      timeline.push({
        week: `Week ${i + 1} (${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`,
        actions: weekActions,
        capacity_hours: 40, // Standard work week
        allocated_hours: allocatedHours,
      })
    }

    return timeline
  }

  /**
   * Assign actions to team members based on capacity and skills
   */
  static assignActionsToTeam(
    actions: ActionItem[],
    team: TeamMember[]
  ): Map<string, ActionItem[]> {
    const assignments = new Map<string, ActionItem[]>()

    // Initialize assignments
    team.forEach((member) => {
      assignments.set(member.id, [])
    })

    // Sort actions by priority
    const sortedActions = [...actions].sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })

    // Assign actions
    sortedActions.forEach((action) => {
      // Find team member with lowest workload and matching skills
      const availableMembers = team.filter((member) => {
        const currentLoad = assignments.get(member.id)?.reduce((sum, a) => sum + a.estimated_hours, 0) || 0
        return currentLoad + action.estimated_hours <= member.capacity_hours_per_week
      })

      if (availableMembers.length > 0) {
        // Assign to person with best skill match
        const bestMember = availableMembers[0]
        assignments.get(bestMember.id)!.push({ ...action, owner: bestMember.name })
      }
    })

    return assignments
  }

  /**
   * Create dependency graph for visualization
   */
  static createDependencyGraph(actions: ActionItem[]): ActionDependencyGraph {
    const nodes: ActionNode[] = actions.map((action, index) => ({
      id: action.id,
      action,
      x: (index % 5) * 200,
      y: Math.floor(index / 5) * 150,
    }))

    const edges: ActionEdge[] = []

    actions.forEach((action) => {
      action.dependencies.forEach((depId) => {
        if (actions.find((a) => a.id === depId)) {
          edges.push({
            from: depId,
            to: action.id,
            type: 'blocks',
          })
        }
      })
    })

    return { nodes, edges }
  }

  /**
   * Calculate critical path
   */
  static calculateCriticalPath(actions: ActionItem[]): string[] {
    const criticalPath: string[] = []
    const actionMap = new Map(actions.map((a) => [a.id, a]))

    // Find actions with no dependencies
    const startActions = actions.filter((a) => a.dependencies.length === 0)

    // Simple critical path - longest chain
    let currentActions = startActions
    while (currentActions.length > 0) {
      // Find action with longest estimated time
      const longestAction = currentActions.reduce((max, action) =>
        action.estimated_hours > max.estimated_hours ? action : max
      )

      criticalPath.push(longestAction.id)

      // Find actions that depend on this one
      currentActions = actions.filter((a) => a.dependencies.includes(longestAction.id))
    }

    return criticalPath
  }

  /**
   * Identify bottlenecks
   */
  static identifyBottlenecks(
    actions: ActionItem[],
    team: TeamMember[]
  ): {
    overloaded_members: string[]
    blocked_actions: ActionItem[]
    capacity_issues: string[]
  } {
    const overloadedMembers: string[] = []
    const blockedActions = actions.filter((a) => a.status === 'blocked')
    const capacityIssues: string[] = []

    // Check team capacity
    const assignments = this.assignActionsToTeam(actions, team)

    team.forEach((member) => {
      const assignedActions = assignments.get(member.id) || []
      const totalHours = assignedActions.reduce((sum, a) => sum + a.estimated_hours, 0)

      if (totalHours > member.capacity_hours_per_week) {
        overloadedMembers.push(member.name)
        capacityIssues.push(
          `${member.name} is overloaded by ${totalHours - member.capacity_hours_per_week} hours`
        )
      }
    })

    // Check for unassigned actions
    const unassigned = actions.filter((a) => !a.owner)
    if (unassigned.length > 0) {
      capacityIssues.push(`${unassigned.length} actions are unassigned`)
    }

    return {
      overloaded_members: overloadedMembers,
      blocked_actions: blockedActions,
      capacity_issues: capacityIssues,
    }
  }

  /**
   * Generate action plan report
   */
  static generateActionPlanReport(actions: ActionItem[]): {
    total_actions: number
    by_status: Record<string, number>
    by_priority: Record<string, number>
    total_estimated_hours: number
    overdue_count: number
    completion_rate: number
  } {
    const today = new Date()

    const byStatus: Record<string, number> = {
      not_started: 0,
      in_progress: 0,
      blocked: 0,
      completed: 0,
      cancelled: 0,
    }

    const byPriority: Record<string, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    }

    let totalEstimatedHours = 0
    let overdueCount = 0
    let completedCount = 0

    actions.forEach((action) => {
      byStatus[action.status]++
      byPriority[action.priority]++
      totalEstimatedHours += action.estimated_hours

      if (action.status === 'completed') {
        completedCount++
      }

      if (action.status !== 'completed' && new Date(action.due_date) < today) {
        overdueCount++
      }
    })

    return {
      total_actions: actions.length,
      by_status: byStatus,
      by_priority: byPriority,
      total_estimated_hours: totalEstimatedHours,
      overdue_count: overdueCount,
      completion_rate: actions.length > 0 ? (completedCount / actions.length) * 100 : 0,
    }
  }

  /**
   * Suggest next actions based on priority and dependencies
   */
  static suggestNextActions(actions: ActionItem[], limit: number = 5): ActionItem[] {
    const today = new Date()

    return actions
      .filter((action) => {
        // Not started or in progress
        if (!['not_started', 'in_progress'].includes(action.status)) return false

        // All dependencies completed
        const allDepsCompleted = action.dependencies.every((depId) => {
          const dep = actions.find((a) => a.id === depId)
          return dep?.status === 'completed'
        })

        return allDepsCompleted
      })
      .sort((a, b) => {
        // Sort by priority first
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
        if (priorityDiff !== 0) return priorityDiff

        // Then by due date
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      })
      .slice(0, limit)
  }
}
