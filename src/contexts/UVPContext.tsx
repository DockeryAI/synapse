/**
 * UVPContext
 * Manages UVP statements, components, A/B tests, and AI generation
 * Provides centralized state management for the UVP Flow section
 */

import * as React from 'react'
import { supabase } from '@/lib/supabase'
import type {
  ValueStatement,
  UVPComponent,
  UVPABTest,
  ValueStatementFormData,
  UVPFlowTab,
  UVPBuilderMode,
  UVPScoreBreakdown,
  UVPContext as UVPContextType,
  ValueStatementStatus,
} from '@/types/uvp.types'

interface UVPContextValue {
  // Current data
  statements: ValueStatement[]
  components: UVPComponent[]
  abTests: UVPABTest[]

  // Selected items
  selectedStatement: ValueStatement | null
  selectedTest: UVPABTest | null

  // UI state
  activeTab: UVPFlowTab
  builderMode: UVPBuilderMode

  // Loading states
  isLoadingStatements: boolean
  isLoadingComponents: boolean
  isLoadingTests: boolean
  isGenerating: boolean
  isScoring: boolean

  // Filters
  statusFilter: ValueStatementStatus | 'all'
  contextFilter: UVPContextType | 'all'

  // Value Statement CRUD
  createStatement: (data: ValueStatementFormData) => Promise<ValueStatement>
  updateStatement: (id: string, data: Partial<ValueStatementFormData>) => Promise<ValueStatement>
  deleteStatement: (id: string) => Promise<void>
  setAsPrimary: (id: string) => Promise<void>
  duplicateStatement: (id: string) => Promise<ValueStatement>

  // Component CRUD
  createComponent: (component: Omit<UVPComponent, 'id' | 'created_at' | 'updated_at' | 'usage_count' | 'last_used_at'>) => Promise<UVPComponent>
  updateComponent: (id: string, updates: Partial<UVPComponent>) => Promise<UVPComponent>
  deleteComponent: (id: string) => Promise<void>

  // A/B Test CRUD
  createABTest: (test: Omit<UVPABTest, 'id' | 'created_at' | 'updated_at'>) => Promise<UVPABTest>
  updateABTest: (id: string, updates: Partial<UVPABTest>) => Promise<UVPABTest>
  deleteABTest: (id: string) => Promise<void>

  // AI Actions (placeholders for now, will be implemented with OpenRouter)
  generateUVP: (prompt: string) => Promise<ValueStatement>
  generateVariants: (statementId: string, count: number) => Promise<ValueStatement[]>
  scoreStatement: (statement: ValueStatementFormData) => Promise<UVPScoreBreakdown>
  predictABTest: (testId: string) => Promise<UVPABTest>

  // UI Actions
  setActiveTab: (tab: UVPFlowTab) => void
  setBuilderMode: (mode: UVPBuilderMode) => void
  selectStatement: (statement: ValueStatement | null) => void
  selectTest: (test: UVPABTest | null) => void
  setStatusFilter: (status: ValueStatementStatus | 'all') => void
  setContextFilter: (context: UVPContextType | 'all') => void

  // Refresh actions
  refreshStatements: () => Promise<void>
  refreshComponents: () => Promise<void>
  refreshTests: () => Promise<void>
}

const UVPContext = React.createContext<UVPContextValue | undefined>(undefined)

interface UVPProviderProps {
  children: React.ReactNode
  brandId: string
}

export const UVPProvider: React.FC<UVPProviderProps> = ({ children, brandId }) => {
  // Data state
  const [statements, setStatements] = React.useState<ValueStatement[]>([])
  const [components, setComponents] = React.useState<UVPComponent[]>([])
  const [abTests, setABTests] = React.useState<UVPABTest[]>([])

  // Selected items
  const [selectedStatement, setSelectedStatement] = React.useState<ValueStatement | null>(null)
  const [selectedTest, setSelectedTest] = React.useState<UVPABTest | null>(null)

  // UI state
  const [activeTab, setActiveTab] = React.useState<UVPFlowTab>('builder')
  const [builderMode, setBuilderMode] = React.useState<UVPBuilderMode>('canvas')

  // Loading states
  const [isLoadingStatements, setIsLoadingStatements] = React.useState(false)
  const [isLoadingComponents, setIsLoadingComponents] = React.useState(false)
  const [isLoadingTests, setIsLoadingTests] = React.useState(false)
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [isScoring, setIsScoring] = React.useState(false)

  // Filters
  const [statusFilter, setStatusFilter] = React.useState<ValueStatementStatus | 'all'>('all')
  const [contextFilter, setContextFilter] = React.useState<UVPContextType | 'all'>('all')

  // =====================================================
  // Load Data Functions
  // =====================================================

  const refreshStatements = React.useCallback(async () => {
    setIsLoadingStatements(true)
    try {
      const { data, error } = await supabase
        .from('value_statements')
        .select('*')
        .eq('brand_id', brandId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setStatements((data as ValueStatement[]) || [])
    } catch (error) {
      console.error('Failed to load value statements:', error)
      setStatements([])
    } finally {
      setIsLoadingStatements(false)
    }
  }, [brandId])

  const refreshComponents = React.useCallback(async () => {
    setIsLoadingComponents(true)
    try {
      const { data, error } = await supabase
        .from('uvp_components')
        .select('*')
        .eq('brand_id', brandId)
        .order('usage_count', { ascending: false })

      if (error) throw error
      setComponents((data as UVPComponent[]) || [])
    } catch (error) {
      console.error('Failed to load UVP components:', error)
      setComponents([])
    } finally {
      setIsLoadingComponents(false)
    }
  }, [brandId])

  const refreshTests = React.useCallback(async () => {
    setIsLoadingTests(true)
    try {
      const { data, error } = await supabase
        .from('uvp_ab_tests')
        .select('*')
        .eq('brand_id', brandId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setABTests((data as UVPABTest[]) || [])
    } catch (error) {
      console.error('Failed to load A/B tests:', error)
      setABTests([])
    } finally {
      setIsLoadingTests(false)
    }
  }, [brandId])

  // Load all data on mount
  React.useEffect(() => {
    refreshStatements()
    refreshComponents()
    refreshTests()
  }, [refreshStatements, refreshComponents, refreshTests])

  // =====================================================
  // Value Statement CRUD
  // =====================================================

  const createStatement = React.useCallback(async (data: ValueStatementFormData): Promise<ValueStatement> => {
    const newStatement = {
      brand_id: brandId,
      headline: data.headline,
      subheadline: data.subheadline,
      supporting_points: data.supporting_points,
      call_to_action: data.call_to_action,
      variant_name: data.variant_name,
      target_persona: data.target_persona,
      context: data.context,
      problem_statement: data.problem_statement,
      solution_statement: data.solution_statement,
      outcome_statement: data.outcome_statement,
      clarity_score: 0,
      conversion_potential: 0,
      power_words_count: 0,
      jargon_count: 0,
      is_primary: false,
      status: 'draft' as const,
    }

    const { data: inserted, error } = await supabase
      .from('value_statements')
      .insert(newStatement)
      .select()
      .single()

    if (error) throw error

    await refreshStatements()
    return inserted as ValueStatement
  }, [brandId, refreshStatements])

  const updateStatement = React.useCallback(async (
    id: string,
    data: Partial<ValueStatementFormData>
  ): Promise<ValueStatement> => {
    const { data: updated, error } = await supabase
      .from('value_statements')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    await refreshStatements()
    return updated as ValueStatement
  }, [refreshStatements])

  const deleteStatement = React.useCallback(async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('value_statements')
      .delete()
      .eq('id', id)

    if (error) throw error

    await refreshStatements()

    // Clear selection if deleted statement was selected
    if (selectedStatement?.id === id) {
      setSelectedStatement(null)
    }
  }, [refreshStatements, selectedStatement])

  const setAsPrimary = React.useCallback(async (id: string): Promise<void> => {
    // First, unset any existing primary
    await supabase
      .from('value_statements')
      .update({ is_primary: false })
      .eq('brand_id', brandId)
      .eq('is_primary', true)

    // Then set the new primary
    const { error } = await supabase
      .from('value_statements')
      .update({ is_primary: true })
      .eq('id', id)

    if (error) throw error

    await refreshStatements()
  }, [brandId, refreshStatements])

  const duplicateStatement = React.useCallback(async (id: string): Promise<ValueStatement> => {
    const original = statements.find(s => s.id === id)
    if (!original) throw new Error('Statement not found')

    const duplicate = {
      brand_id: brandId,
      headline: `${original.headline} (Copy)`,
      subheadline: original.subheadline,
      supporting_points: original.supporting_points,
      call_to_action: original.call_to_action,
      variant_name: original.variant_name ? `${original.variant_name} (Copy)` : undefined,
      target_persona: original.target_persona,
      context: original.context,
      problem_statement: original.problem_statement,
      solution_statement: original.solution_statement,
      outcome_statement: original.outcome_statement,
      clarity_score: 0,
      conversion_potential: 0,
      power_words_count: 0,
      jargon_count: 0,
      is_primary: false,
      status: 'draft' as const,
    }

    const { data: inserted, error } = await supabase
      .from('value_statements')
      .insert(duplicate)
      .select()
      .single()

    if (error) throw error

    await refreshStatements()
    return inserted as ValueStatement
  }, [brandId, statements, refreshStatements])

  // =====================================================
  // Component CRUD
  // =====================================================

  const createComponent = React.useCallback(async (
    component: Omit<UVPComponent, 'id' | 'created_at' | 'updated_at' | 'usage_count' | 'last_used_at'>
  ): Promise<UVPComponent> => {
    const newComponent = {
      ...component,
      brand_id: brandId,
      usage_count: 0,
    }

    const { data: inserted, error } = await supabase
      .from('uvp_components')
      .insert(newComponent)
      .select()
      .single()

    if (error) throw error

    await refreshComponents()
    return inserted as UVPComponent
  }, [brandId, refreshComponents])

  const updateComponent = React.useCallback(async (
    id: string,
    updates: Partial<UVPComponent>
  ): Promise<UVPComponent> => {
    const { data: updated, error } = await supabase
      .from('uvp_components')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    await refreshComponents()
    return updated as UVPComponent
  }, [refreshComponents])

  const deleteComponent = React.useCallback(async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('uvp_components')
      .delete()
      .eq('id', id)

    if (error) throw error

    await refreshComponents()
  }, [refreshComponents])

  // =====================================================
  // A/B Test CRUD
  // =====================================================

  const createABTest = React.useCallback(async (
    test: Omit<UVPABTest, 'id' | 'created_at' | 'updated_at'>
  ): Promise<UVPABTest> => {
    const newTest = {
      ...test,
      brand_id: brandId,
    }

    const { data: inserted, error } = await supabase
      .from('uvp_ab_tests')
      .insert(newTest)
      .select()
      .single()

    if (error) throw error

    await refreshTests()
    return inserted as UVPABTest
  }, [brandId, refreshTests])

  const updateABTest = React.useCallback(async (
    id: string,
    updates: Partial<UVPABTest>
  ): Promise<UVPABTest> => {
    const { data: updated, error } = await supabase
      .from('uvp_ab_tests')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    await refreshTests()
    return updated as UVPABTest
  }, [refreshTests])

  const deleteABTest = React.useCallback(async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('uvp_ab_tests')
      .delete()
      .eq('id', id)

    if (error) throw error

    await refreshTests()

    // Clear selection if deleted test was selected
    if (selectedTest?.id === id) {
      setSelectedTest(null)
    }
  }, [refreshTests, selectedTest])

  // =====================================================
  // AI Actions (Placeholders - will be implemented with OpenRouter)
  // =====================================================

  const generateUVP = React.useCallback(async (prompt: string): Promise<ValueStatement> => {
    setIsGenerating(true)
    try {
      // TODO: Implement with OpenRouter API
      // For now, return a mock statement
      throw new Error('AI generation not yet implemented')
    } finally {
      setIsGenerating(false)
    }
  }, [])

  const generateVariants = React.useCallback(async (
    statementId: string,
    count: number
  ): Promise<ValueStatement[]> => {
    setIsGenerating(true)
    try {
      // TODO: Implement with OpenRouter API
      throw new Error('Variant generation not yet implemented')
    } finally {
      setIsGenerating(false)
    }
  }, [])

  const scoreStatement = React.useCallback(async (
    statement: ValueStatementFormData
  ): Promise<UVPScoreBreakdown> => {
    setIsScoring(true)
    try {
      // TODO: Implement with ContentPsychologyEngine and BrandHealthCalculator
      throw new Error('Statement scoring not yet implemented')
    } finally {
      setIsScoring(false)
    }
  }, [])

  const predictABTest = React.useCallback(async (testId: string): Promise<UVPABTest> => {
    setIsGenerating(true)
    try {
      // TODO: Implement AI prediction logic
      throw new Error('A/B test prediction not yet implemented')
    } finally {
      setIsGenerating(false)
    }
  }, [])

  // =====================================================
  // Context Value
  // =====================================================

  const value: UVPContextValue = {
    // Data
    statements,
    components,
    abTests,

    // Selected items
    selectedStatement,
    selectedTest,

    // UI state
    activeTab,
    builderMode,

    // Loading states
    isLoadingStatements,
    isLoadingComponents,
    isLoadingTests,
    isGenerating,
    isScoring,

    // Filters
    statusFilter,
    contextFilter,

    // Value Statement CRUD
    createStatement,
    updateStatement,
    deleteStatement,
    setAsPrimary,
    duplicateStatement,

    // Component CRUD
    createComponent,
    updateComponent,
    deleteComponent,

    // A/B Test CRUD
    createABTest,
    updateABTest,
    deleteABTest,

    // AI Actions
    generateUVP,
    generateVariants,
    scoreStatement,
    predictABTest,

    // UI Actions
    setActiveTab,
    setBuilderMode,
    selectStatement: setSelectedStatement,
    selectTest: setSelectedTest,
    setStatusFilter,
    setContextFilter,

    // Refresh actions
    refreshStatements,
    refreshComponents,
    refreshTests,
  }

  return <UVPContext.Provider value={value}>{children}</UVPContext.Provider>
}

export const useUVP = (): UVPContextValue => {
  const context = React.useContext(UVPContext)
  if (!context) {
    throw new Error('useUVP must be used within a UVPProvider')
  }
  return context
}
