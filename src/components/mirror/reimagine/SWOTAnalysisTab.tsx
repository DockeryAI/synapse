/**
 * SWOT Analysis Tab for REIMAGINE Section
 * Post-UVP: Comprehensive SWOT based on all gathered intelligence
 * Reuses the DynamicSWOTSection component
 */

import * as React from 'react'
import { DynamicSWOTSection } from '../subsections/DynamicSWOTSection'

interface SWOTAnalysisTabProps {
  brandId: string
  brandData?: any
  hasCompletedUVP: boolean
  className?: string
}

export const SWOTAnalysisTab: React.FC<SWOTAnalysisTabProps> = ({
  brandId,
  brandData,
  hasCompletedUVP,
  className,
}) => {
  return (
    <div className={className}>
      <DynamicSWOTSection
        brandId={brandId}
        brandData={brandData}
        hasCompletedUVP={hasCompletedUVP}
      />
    </div>
  )
}
