/**
 * Business Model Detector Service
 * Classifies businesses by size/type for SMB-focused competitive analysis
 */

import {
  type BrandData,
  type BusinessModel,
  type BusinessModelDetection,
  type Competitor,
} from '@/types/mirror-diagnostics'
import { chat } from '@/lib/openrouter'
import { PerplexityAPI } from '@/services/uvp-wizard/perplexity-api'

const perplexityAPI = new PerplexityAPI()

export class BusinessModelDetectorService {
  /**
   * Detect business model from brand data
   */
  static async detectBusinessModel(brandData: BrandData): Promise<BusinessModelDetection> {
    const signals: string[] = []
    let confidence = 100

    // Analyze size if provided
    const sizeIndicator = this.analyzeSizeIndicator(brandData.size)
    if (sizeIndicator) {
      signals.push(sizeIndicator.signal)
      return {
        model: sizeIndicator.model,
        confidence,
        signals,
      }
    }

    // Analyze company name for clues
    const nameIndicator = this.analyzeCompanyName(brandData.name)
    if (nameIndicator) {
      signals.push(nameIndicator.signal)
      confidence = 80
    }

    // Analyze online presence if available
    if (brandData.website) {
      const websiteIndicator = await this.analyzeWebsitePresence(brandData)
      if (websiteIndicator) {
        signals.push(websiteIndicator.signal)
        if (!nameIndicator) {
          return {
            model: websiteIndicator.model,
            confidence: 70,
            signals,
          }
        }
      }
    }

    // Default to small-local for SMB-focused analysis
    const model = nameIndicator?.model || 'small-local'
    signals.push('Default classification based on SMB focus')

    return {
      model,
      confidence: nameIndicator ? confidence : 50,
      signals,
    }
  }

  /**
   * Classify a competitor's business model from their name and info
   */
  static async classifyCompetitor(
    competitorName: string,
    industry: string
  ): Promise<BusinessModelDetection> {
    const signals: string[] = []

    // Check for obvious enterprise indicators
    const nameIndicator = this.analyzeCompanyName(competitorName)
    if (nameIndicator && ['enterprise', 'national'].includes(nameIndicator.model)) {
      signals.push(nameIndicator.signal)
      return {
        model: nameIndicator.model,
        confidence: 90,
        signals,
      }
    }

    // Use AI to classify based on web search
    try {
      const searchResponse = await perplexityAPI.getIndustryInsights({
        query: `${competitorName} ${industry} company size locations employees`,
        context: { industry },
        max_results: 3,
      })

      const analysis = await chat(
        [
          {
            role: 'user',
            content: `Classify this business as one of: solo-practitioner, small-local, multi-location, regional, national, enterprise.

Business: ${competitorName}
Industry: ${industry}

Information:
${searchResponse.insights.join('\n')}

Return ONLY valid JSON:
{
  "model": "small-local",
  "signals": ["Reason 1", "Reason 2"]
}`,
          },
        ],
        {
          temperature: 0.3,
          maxTokens: 300,
        }
      )

      const parsed = JSON.parse(analysis)
      return {
        model: parsed.model || 'small-local',
        confidence: 70,
        signals: parsed.signals || [],
      }
    } catch (error) {
      console.error('[BusinessModelDetector] Failed to classify competitor:', error)
      // Default to small-local
      return {
        model: nameIndicator?.model || 'small-local',
        confidence: 40,
        signals: nameIndicator ? [nameIndicator.signal] : ['Unable to determine size'],
      }
    }
  }

  /**
   * Filter competitors to only relevant size category
   */
  static filterRelevantCompetitors(
    brandModel: BusinessModel,
    competitors: Competitor[]
  ): Competitor[] {
    // Define which competitor types are relevant for each brand type
    const relevanceMap: Record<BusinessModel, BusinessModel[]> = {
      'solo-practitioner': ['solo-practitioner', 'small-local'],
      'small-local': ['solo-practitioner', 'small-local', 'multi-location'],
      'multi-location': ['small-local', 'multi-location', 'regional'],
      regional: ['multi-location', 'regional', 'national'],
      national: ['regional', 'national', 'enterprise'],
      enterprise: ['national', 'enterprise'],
    }

    const relevantModels = relevanceMap[brandModel]

    return competitors.filter((competitor) => {
      if (!competitor.business_model) return true // Keep if unknown
      return relevantModels.includes(competitor.business_model)
    })
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Analyze size field if provided
   */
  private static analyzeSizeIndicator(
    size?: string
  ): { model: BusinessModel; signal: string } | null {
    if (!size) return null

    const sizeStr = size.toLowerCase()

    // Solo practitioner indicators
    if (
      sizeStr.includes('1 employee') ||
      sizeStr.includes('self-employed') ||
      sizeStr.includes('freelance')
    ) {
      return {
        model: 'solo-practitioner',
        signal: `Size field indicates solo operation: "${size}"`,
      }
    }

    // Small local indicators
    if (sizeStr.match(/^[2-9]/) || sizeStr.includes('2-10')) {
      return {
        model: 'small-local',
        signal: `Size field indicates small business: "${size}"`,
      }
    }

    // Enterprise indicators
    if (
      sizeStr.includes('1000+') ||
      sizeStr.includes('10,000+') ||
      sizeStr.includes('enterprise')
    ) {
      return {
        model: 'enterprise',
        signal: `Size field indicates enterprise: "${size}"`,
      }
    }

    // National indicators
    if (sizeStr.includes('500+') || sizeStr.includes('100-500')) {
      return {
        model: 'national',
        signal: `Size field indicates national presence: "${size}"`,
      }
    }

    // Regional indicators
    if (sizeStr.includes('50-100') || sizeStr.includes('20-50')) {
      return {
        model: 'regional',
        signal: `Size field indicates regional presence: "${size}"`,
      }
    }

    return null
  }

  /**
   * Analyze company name for business model clues
   */
  private static analyzeCompanyName(
    name: string
  ): { model: BusinessModel; signal: string } | null {
    const nameLower = name.toLowerCase()

    // Enterprise indicators in name
    const enterpriseIndicators = [
      'corporation',
      'corp',
      'inc.',
      'incorporated',
      'holdings',
      'group',
      'international',
      'global',
      'worldwide',
      'enterprises',
    ]

    for (const indicator of enterpriseIndicators) {
      if (nameLower.includes(indicator)) {
        return {
          model: 'enterprise',
          signal: `Company name indicates enterprise: contains "${indicator}"`,
        }
      }
    }

    // National chain indicators
    const nationalIndicators = [
      'national',
      'america',
      'american',
      'usa',
      'united states',
    ]

    for (const indicator of nationalIndicators) {
      if (nameLower.includes(indicator)) {
        return {
          model: 'national',
          signal: `Company name indicates national presence: contains "${indicator}"`,
        }
      }
    }

    // Solo practitioner indicators
    if (
      nameLower.includes(' consulting') ||
      nameLower.includes('freelance') ||
      nameLower.match(/^[a-z]+ [a-z]+ (tax|accounting|consulting|design)$/i)
    ) {
      return {
        model: 'solo-practitioner',
        signal: 'Company name pattern suggests solo practitioner',
      }
    }

    // Local business indicators
    const locationWords = [
      'local',
      'hometown',
      'neighborhood',
      'community',
      'family-owned',
      'family owned',
    ]

    for (const word of locationWords) {
      if (nameLower.includes(word)) {
        return {
          model: 'small-local',
          signal: `Company name indicates local business: contains "${word}"`,
        }
      }
    }

    return null
  }

  /**
   * Analyze website presence to infer business model
   */
  private static async analyzeWebsitePresence(
    brandData: BrandData
  ): Promise<{ model: BusinessModel; signal: string } | null> {
    if (!brandData.website) return null

    try {
      // Search for company info
      const response = await perplexityAPI.getIndustryInsights({
        query: `${brandData.name} company size employees locations`,
        context: { industry: brandData.industry },
        max_results: 3,
      })

      const content = response.insights.join(' ').toLowerCase()

      // Look for size indicators in the content
      if (content.includes('multinational') || content.includes('fortune 500')) {
        return {
          model: 'enterprise',
          signal: 'Web research indicates multinational/Fortune 500 company',
        }
      }

      if (
        content.includes('nationwide') ||
        content.includes('all 50 states') ||
        content.includes('national chain')
      ) {
        return {
          model: 'national',
          signal: 'Web research indicates national presence',
        }
      }

      if (content.includes('regional') || content.includes('multiple states')) {
        return {
          model: 'regional',
          signal: 'Web research indicates regional presence',
        }
      }

      if (
        content.includes('multiple locations') ||
        content.includes('several locations')
      ) {
        return {
          model: 'multi-location',
          signal: 'Web research indicates multiple locations',
        }
      }

      if (
        content.includes('single location') ||
        content.includes('one location') ||
        content.includes('locally owned')
      ) {
        return {
          model: 'small-local',
          signal: 'Web research indicates single location business',
        }
      }

      return null
    } catch (error) {
      console.error('[BusinessModelDetector] Website analysis failed:', error)
      return null
    }
  }
}
