/**
 * useBrand Hook
 *
 * Separated from BrandContext.tsx for Vite HMR compatibility.
 * .tsx files must only export React components for Fast Refresh to work.
 * Hooks must be in .ts files.
 *
 * See: docs/PAGE_RESET_RESEARCH.md
 */

import { useContext } from 'react'
import { BrandContext } from '@/contexts/BrandContext'
import type { BrandContextValue } from '@/contexts/BrandContext'

export function useBrand(): BrandContextValue {
  const context = useContext(BrandContext)
  if (!context) {
    throw new Error('useBrand must be used within a BrandProvider')
  }
  return context
}
