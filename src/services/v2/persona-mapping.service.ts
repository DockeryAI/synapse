/**
 * Persona Mapping Service
 * Auto-detects customer personas and maps content to target segments
 */

import type {
  CustomerPersona,
  PersonaProfile,
  PersonaAssignment,
  SegmentMatchInput,
  SegmentMatchScore,
  CreatePersonaInput,
  UpdatePersonaInput,
  PersonaMappingConfig,
  SegmentEQMapping,
} from '@/types/v2';
import type { EmotionalTrigger } from '@/types/v2';

export interface PersonaDetectionResult {
  personas: CustomerPersona[];
  confidence: number;
  detectionMethod: 'industry_analysis' | 'content_analysis' | 'buyer_intelligence' | 'manual';
  sources: string[];
}

export interface PersonaMatchResult {
  personaId: string;
  personaName: string;
  matchScore: number;
  matchReasons: string[];
  confidence: number;
}

export class PersonaMappingService {
  private personas: Map<string, CustomerPersona> = new Map();
  private personaProfiles: Map<string, PersonaProfile> = new Map();
  private assignments: Map<string, PersonaAssignment[]> = new Map();
  private config: PersonaMappingConfig = {
    autoDetectEnabled: true,
    minConfidenceThreshold: 70,
    allowMultiplePersonas: true,
    maxPersonasPerPiece: 2,
    useHistoricalData: true,
    fallbackToPrimaryPersona: true,
  };

  /**
   * Auto-detect personas from business data
   */
  async detectPersonas(businessData: {
    industry: string;
    specialty?: string;
    targetAudience?: string;
    services?: string[];
    customerReviews?: string[];
  }): Promise<PersonaDetectionResult> {
    const personas: CustomerPersona[] = [];

    // Industry-based persona detection
    if (businessData.industry) {
      const industryPersonas = this.detectIndustryPersonas(businessData.industry, businessData.specialty);
      personas.push(...industryPersonas);
    }

    // Service-based persona detection
    if (businessData.services && businessData.services.length > 0) {
      const servicePersonas = this.detectServicePersonas(businessData.services);
      personas.push(...servicePersonas);
    }

    // Review-based persona detection
    if (businessData.customerReviews && businessData.customerReviews.length > 0) {
      const reviewPersonas = this.extractPersonasFromReviews(businessData.customerReviews);
      personas.push(...reviewPersonas);
    }

    // Deduplicate and merge similar personas
    const uniquePersonas = this.deduplicatePersonas(personas);

    return {
      personas: uniquePersonas,
      confidence: personas.length > 0 ? 85 : 50,
      detectionMethod: 'industry_analysis',
      sources: [
        businessData.industry && 'industry',
        businessData.services && 'services',
        businessData.customerReviews && 'reviews',
      ].filter(Boolean) as string[],
    };
  }

  /**
   * Create a new persona
   */
  createPersona(input: CreatePersonaInput): CustomerPersona {
    const persona: CustomerPersona = {
      id: this.generateId(),
      name: input.name,
      description: input.description,
      demographics: input.demographics || {},
      psychographics: input.psychographics,
      behavioralTraits: input.behavioralTraits,
      source: 'manual',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.personas.set(persona.id, persona);
    return persona;
  }

  /**
   * Update an existing persona
   */
  updatePersona(personaId: string, input: UpdatePersonaInput): CustomerPersona | null {
    const persona = this.personas.get(personaId);
    if (!persona) {
      return null;
    }

    const updated: CustomerPersona = {
      ...persona,
      ...(input.name && { name: input.name }),
      ...(input.description && { description: input.description }),
      demographics: { ...persona.demographics, ...input.demographics },
      psychographics: { ...persona.psychographics, ...input.psychographics },
      behavioralTraits: { ...persona.behavioralTraits, ...input.behavioralTraits },
      updatedAt: new Date().toISOString(),
    };

    this.personas.set(personaId, updated);
    return updated;
  }

  /**
   * Get persona by ID
   */
  getPersona(personaId: string): CustomerPersona | null {
    return this.personas.get(personaId) || null;
  }

  /**
   * Get all personas
   */
  getAllPersonas(): CustomerPersona[] {
    return Array.from(this.personas.values());
  }

  /**
   * Delete a persona
   */
  deletePersona(personaId: string): boolean {
    return this.personas.delete(personaId);
  }

  /**
   * Calculate match score between content and persona
   */
  calculatePersonaMatch(
    content: SegmentMatchInput,
    personaId: string
  ): PersonaMatchResult | null {
    const persona = this.personas.get(personaId);
    if (!persona) {
      return null;
    }

    const matchReasons: string[] = [];
    let matchScore = 0;

    // Pain point alignment (40% of score)
    const painPointScore = this.scorePainPointAlignment(content, persona);
    matchScore += painPointScore * 0.4;
    if (painPointScore > 70) {
      matchReasons.push(`Addresses key pain point: ${persona.psychographics.painPoints[0]}`);
    }

    // Goal alignment (30% of score)
    const goalScore = this.scoreGoalAlignment(content, persona);
    matchScore += goalScore * 0.3;
    if (goalScore > 70) {
      matchReasons.push(`Aligns with persona goal: ${persona.psychographics.goals[0]}`);
    }

    // Behavioral fit (20% of score)
    const behavioralScore = this.scoreBehavioralFit(content, persona);
    matchScore += behavioralScore * 0.2;
    if (behavioralScore > 70) {
      matchReasons.push(`Matches ${persona.behavioralTraits.decisionMakingStyle} decision style`);
    }

    // Content preference (10% of score)
    const contentPrefScore = this.scoreContentPreference(content, persona);
    matchScore += contentPrefScore * 0.1;

    return {
      personaId: persona.id,
      personaName: persona.name,
      matchScore: Math.round(matchScore),
      matchReasons,
      confidence: matchReasons.length >= 2 ? 85 : 60,
    };
  }

  /**
   * Assign content to persona(s)
   */
  assignPersonaToPiece(
    pieceId: string,
    personaId: string,
    assignmentType: 'primary' | 'secondary' = 'primary',
    matchScore?: number
  ): PersonaAssignment {
    const assignment: PersonaAssignment = {
      pieceId,
      personaId,
      assignmentType,
      matchScore: matchScore || 0,
      assignedAt: new Date().toISOString(),
      assignedBy: matchScore ? 'auto' : 'manual',
    };

    const existing = this.assignments.get(pieceId) || [];
    existing.push(assignment);
    this.assignments.set(pieceId, existing);

    return assignment;
  }

  /**
   * Get persona assignments for a piece
   */
  getPersonaAssignments(pieceId: string): PersonaAssignment[] {
    return this.assignments.get(pieceId) || [];
  }

  /**
   * Auto-assign personas to content based on match scores
   */
  autoAssignPersonas(
    pieceId: string,
    content: SegmentMatchInput
  ): PersonaAssignment[] {
    if (!this.config.autoDetectEnabled) {
      return [];
    }

    const matches: PersonaMatchResult[] = [];

    // Calculate match scores for all personas
    for (const persona of this.personas.values()) {
      const match = this.calculatePersonaMatch(content, persona.id);
      if (match && match.matchScore >= this.config.minConfidenceThreshold) {
        matches.push(match);
      }
    }

    // Sort by match score
    matches.sort((a, b) => b.matchScore - a.matchScore);

    // Assign top matches
    const assignments: PersonaAssignment[] = [];
    const limit = this.config.allowMultiplePersonas ? this.config.maxPersonasPerPiece : 1;

    for (let i = 0; i < Math.min(matches.length, limit); i++) {
      const match = matches[i];
      const assignment = this.assignPersonaToPiece(
        pieceId,
        match.personaId,
        i === 0 ? 'primary' : 'secondary',
        match.matchScore
      );
      assignments.push(assignment);
    }

    return assignments;
  }

  /**
   * Update persona mapping configuration
   */
  updateConfig(config: Partial<PersonaMappingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): PersonaMappingConfig {
    return { ...this.config };
  }

  // Private helper methods

  private detectIndustryPersonas(industry: string, specialty?: string): CustomerPersona[] {
    // Industry-specific persona templates
    const industryPersonaTemplates: Record<string, Partial<CustomerPersona>[]> = {
      healthcare: [
        {
          name: 'Health-Conscious Professional',
          description: 'Mid-career professional prioritizing preventive health',
          psychographics: {
            goals: ['Maintain health', 'Prevent disease', 'Work-life balance'],
            painPoints: ['Limited time', 'Information overload', 'Cost concerns'],
            values: ['Quality', 'Trust', 'Convenience'],
            challenges: ['Busy schedule', 'Conflicting advice'],
          },
        },
        {
          name: 'Elderly Care Seeker',
          description: 'Family member seeking care for aging parent',
          psychographics: {
            goals: ['Best care for loved one', 'Peace of mind', 'Cost management'],
            painPoints: ['Complexity', 'Emotional stress', 'Decision paralysis'],
            values: ['Compassion', 'Expertise', 'Communication'],
            challenges: ['Coordinating care', 'Understanding options'],
          },
        },
      ],
      legal: [
        {
          name: 'Proactive Business Owner',
          description: 'Entrepreneur seeking legal protection',
          psychographics: {
            goals: ['Protect business', 'Avoid legal issues', 'Peace of mind'],
            painPoints: ['Legal complexity', 'Cost concerns', 'Time constraints'],
            values: ['Clarity', 'Responsiveness', 'Value'],
            challenges: ['Understanding legal jargon', 'Knowing what protection is needed'],
          },
        },
      ],
      finance: [
        {
          name: 'Wealth Builder',
          description: 'Professional seeking investment growth',
          psychographics: {
            goals: ['Build wealth', 'Financial security', 'Retirement planning'],
            painPoints: ['Market volatility', 'Lack of expertise', 'Risk concerns'],
            values: ['Expertise', 'Transparency', 'Performance'],
            challenges: ['Making informed decisions', 'Timing the market'],
          },
        },
      ],
    };

    const templates = industryPersonaTemplates[industry.toLowerCase()] || [];

    return templates.map((template, index) => ({
      id: `${industry}-persona-${index + 1}`,
      name: template.name || 'Generic Persona',
      description: template.description || '',
      demographics: template.demographics || {},
      psychographics: template.psychographics || {
        goals: [],
        painPoints: [],
        values: [],
        challenges: [],
      },
      behavioralTraits: template.behavioralTraits || {
        decisionMakingStyle: 'analytical',
        informationPreference: 'text',
        purchaseDrivers: ['quality', 'trust'],
      },
      source: 'auto-detected',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  }

  private detectServicePersonas(services: string[]): CustomerPersona[] {
    // For now, return empty array - this would analyze services to infer personas
    return [];
  }

  private extractPersonasFromReviews(reviews: string[]): CustomerPersona[] {
    // For now, return empty array - this would use NLP to extract persona patterns
    return [];
  }

  private deduplicatePersonas(personas: CustomerPersona[]): CustomerPersona[] {
    // Simple deduplication by name
    const uniqueMap = new Map<string, CustomerPersona>();
    for (const persona of personas) {
      if (!uniqueMap.has(persona.name)) {
        uniqueMap.set(persona.name, persona);
      }
    }
    return Array.from(uniqueMap.values());
  }

  private scorePainPointAlignment(content: SegmentMatchInput, persona: CustomerPersona): number {
    // Simplified scoring - in real implementation would use NLP
    const contentLower = `${content.content} ${content.title || ''}`.toLowerCase();
    let score = 50; // baseline

    for (const painPoint of persona.psychographics.painPoints) {
      const keywords = painPoint.toLowerCase().split(' ');
      if (keywords.some(kw => contentLower.includes(kw))) {
        score += 15;
      }
    }

    return Math.min(score, 100);
  }

  private scoreGoalAlignment(content: SegmentMatchInput, persona: CustomerPersona): number {
    const contentLower = `${content.content} ${content.title || ''}`.toLowerCase();
    let score = 50;

    for (const goal of persona.psychographics.goals) {
      const keywords = goal.toLowerCase().split(' ');
      if (keywords.some(kw => contentLower.includes(kw))) {
        score += 15;
      }
    }

    return Math.min(score, 100);
  }

  private scoreBehavioralFit(content: SegmentMatchInput, persona: CustomerPersona): number {
    let score = 50;

    // Check information preference
    if (content.contentType) {
      const preferredFormats: Record<string, string[]> = {
        visual: ['image', 'infographic', 'chart'],
        text: ['blog', 'article', 'post'],
        video: ['video', 'reel', 'short'],
        data: ['statistics', 'report', 'analysis'],
      };

      const matchingFormats = preferredFormats[persona.behavioralTraits.informationPreference] || [];
      if (matchingFormats.some(format => content.contentType?.includes(format))) {
        score += 25;
      }
    }

    return Math.min(score, 100);
  }

  private scoreContentPreference(content: SegmentMatchInput, persona: CustomerPersona): number {
    // Simplified - would check message length, tone, etc.
    return 70;
  }

  private generateId(): string {
    return `persona-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
export const personaMappingService = new PersonaMappingService();
