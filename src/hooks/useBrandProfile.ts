/**
 * useBrandProfile Hook
 *
 * Separated from BrandProfileContext.tsx for Vite HMR compatibility.
 * .tsx files must only export React components for Fast Refresh to work.
 * Hooks must be in .ts files.
 *
 * See: docs/PAGE_RESET_RESEARCH.md
 */

import { useContext } from 'react'
import { BrandProfileContext } from '@/contexts/BrandProfileContext'
import type { BrandProfileContextValue } from '@/contexts/BrandProfileContext'

export function useBrandProfile(): BrandProfileContextValue {
  const context = useContext(BrandProfileContext)
  if (!context) {
    throw new Error('useBrandProfile must be used within a BrandProfileProvider')
  }
  return context
}
