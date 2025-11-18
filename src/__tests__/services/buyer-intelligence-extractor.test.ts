/**
 * Buyer Intelligence Extractor Service Tests
 *
 * Tests for AI-powered buyer persona extraction and analysis
 *
 * Created: 2025-11-18
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buyerIntelligenceExtractor } from '@/services/intelligence/buyer-intelligence-extractor.service';
import { createMockTestimonials, createMockScrapedData } from '../utils/test-helpers';

// Mock environment variables
vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-key');

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn()
    },
    auth: {
      getSession: vi.fn(() => Promise.resolve({
        data: { session: { access_token: 'test-token' } }
      }))
    }
  }
}));

import { supabase } from '@/lib/supabase';

describe('BuyerIntelligenceExtractor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('extractBuyerPersonas', () => {
    it('should extract personas from website data successfully', async () => {
      const mockTestimonials = createMockTestimonials();
      const mockWebsiteData = {
        url: 'https://example.com',
        content: 'We help businesses grow through strategic consulting.',
        testimonials: mockTestimonials,
        services: ['Strategic Planning', 'Business Analysis']
      };

      // Mock successful AI response with correct structure
      (supabase.functions.invoke as any).mockResolvedValue({
        data: {
          choices: [{
            message: {
              content: JSON.stringify({
                personas: [
                  {
                    persona_name: 'Marketing Director',
                    role_title: 'Marketing Director',
                    role_seniority: 'Director',
                    company_type: 'SaaS',
                    company_size: '20-100',
                    industry: 'Technology',
                    pain_points: [
                      {
                        description: 'Spending too much time on reporting',
                        category: 'time',
                        intensity: 'high',
                        quote: mockTestimonials[0]
                      }
                    ],
                    desired_outcomes: [
                      {
                        description: 'Save time on reporting',
                        quote: mockTestimonials[0]
                      }
                    ],
                    urgency_signals: [],
                    buying_behavior: {
                      decision_speed: 'medium',
                      research_intensity: 'high',
                      price_sensitivity: 'medium',
                      relationship_vs_transactional: 'relationship'
                    },
                    success_metrics: [],
                    sample_quotes: [mockTestimonials[0]]
                  }
                ],
                common_pain_points: ['time management'],
                common_outcomes: ['efficiency'],
                industry_patterns: ['SaaS growth challenges'],
                data_quality: 'good'
              })
            }
          }],
          usage: {
            prompt_tokens: 100,
            completion_tokens: 500
          }
        },
        error: null
      });

      const result = await buyerIntelligenceExtractor.extractBuyerPersonas(mockWebsiteData);

      // Should successfully extract personas
      expect(result.personas).toBeDefined();
      expect(result.personas.length).toBeGreaterThan(0);

      // Verify result structure matches BuyerIntelligenceResult type
      expect(result).toHaveProperty('personas');
      expect(result).toHaveProperty('total_evidence_points');
      expect(result).toHaveProperty('extraction_quality');
      expect(result).toHaveProperty('extraction_timestamp');
      expect(result).toHaveProperty('common_pain_points');
      expect(result).toHaveProperty('common_outcomes');
      expect(result).toHaveProperty('industry_patterns');
      expect(result).toHaveProperty('data_gaps');
      expect(result).toHaveProperty('assumptions_made');

      // Verify extraction quality is valid
      expect(['excellent', 'good', 'fair', 'poor']).toContain(result.extraction_quality);

      // Verify AI was called
      expect(supabase.functions.invoke).toHaveBeenCalled();
    });

    it('should handle empty website data gracefully', async () => {
      const emptyData = {
        url: 'https://example.com',
        content: ''
      };

      const result = await buyerIntelligenceExtractor.extractBuyerPersonas(emptyData);

      // Should return valid result structure even with no data
      expect(result).toBeDefined();
      expect(result.personas).toBeDefined();
      expect(Array.isArray(result.personas)).toBe(true);
    });

    it('should include pain points in extracted personas', async () => {
      const mockWebsiteData = {
        url: 'https://example.com',
        content: 'Business consulting services',
        testimonials: [
          "I was spending too much time on manual tasks.",
          "Our costs were out of control.",
          "We needed better systems."
        ]
      };

      (supabase.functions.invoke as any).mockResolvedValue({
        data: {
          choices: [{
            message: {
              content: JSON.stringify({
                personas: [{
                  persona_name: 'Operations Manager',
                  role_title: 'Operations Manager',
                  role_seniority: 'Manager',
                  company_type: 'SMB',
                  company_size: '10-50',
                  industry: 'General',
                  pain_points: [
                    { description: 'Manual processes', category: 'time', intensity: 'high', quote: mockWebsiteData.testimonials?.[0] || '' },
                    { description: 'High costs', category: 'cost', intensity: 'high', quote: mockWebsiteData.testimonials?.[1] || '' }
                  ],
                  desired_outcomes: [],
                  urgency_signals: [],
                  buying_behavior: {
                    decision_speed: 'slow',
                    research_intensity: 'high',
                    price_sensitivity: 'high',
                    relationship_vs_transactional: 'relationship'
                  },
                  success_metrics: [],
                  sample_quotes: mockWebsiteData.testimonials || []
                }],
                common_pain_points: ['time', 'cost'],
                common_outcomes: [],
                industry_patterns: [],
                data_quality: 'fair'
              })
            }
          }],
          usage: { prompt_tokens: 100, completion_tokens: 300 }
        },
        error: null
      });

      const result = await buyerIntelligenceExtractor.extractBuyerPersonas(mockWebsiteData);

      // Should extract pain points
      expect(result.personas.length).toBeGreaterThan(0);

      const firstPersona = result.personas[0];
      expect(firstPersona.pain_points).toBeDefined();
      expect(firstPersona.pain_points.length).toBeGreaterThan(0);

      // Verify pain point structure
      firstPersona.pain_points.forEach(painPoint => {
        expect(painPoint).toHaveProperty('description');
        expect(painPoint).toHaveProperty('category');
      });
    });

    it('should handle API errors gracefully', async () => {
      const mockWebsiteData = {
        url: 'https://example.com',
        content: 'Test content'
      };

      // Mock API error
      (supabase.functions.invoke as any).mockRejectedValue(
        new Error('API Error: Rate limit exceeded')
      );

      const result = await buyerIntelligenceExtractor.extractBuyerPersonas(mockWebsiteData);

      // Should handle error gracefully and return empty result
      expect(result).toBeDefined();
      expect(result.personas).toBeDefined();
      expect(Array.isArray(result.personas)).toBe(true);
    });

    it('should extract multiple personas when available', async () => {
      const mockWebsiteData = {
        url: 'https://example.com',
        content: 'Business services',
        testimonials: [
          "As a CEO, I needed help scaling.",
          "As a CFO, I needed better financial controls.",
          "As a Marketing Director, I needed better data."
        ]
      };

      (supabase.functions.invoke as any).mockResolvedValue({
        data: {
          choices: [{
            message: {
              content: JSON.stringify({
                personas: [
                  {
                    persona_name: 'CEO',
                    role_title: 'CEO',
                    role_seniority: 'Executive',
                    company_type: 'Startup',
                    company_size: '10-50',
                    industry: 'General',
                    pain_points: [],
                    desired_outcomes: [{ description: 'Scale business', quote: mockWebsiteData.testimonials?.[0] || '' }],
                    urgency_signals: [],
                    buying_behavior: { decision_speed: 'fast', research_intensity: 'medium', price_sensitivity: 'low', relationship_vs_transactional: 'relationship' },
                    success_metrics: [],
                    sample_quotes: []
                  },
                  {
                    persona_name: 'CFO',
                    role_title: 'CFO',
                    role_seniority: 'Executive',
                    company_type: 'SMB',
                    company_size: '50-200',
                    industry: 'General',
                    pain_points: [],
                    desired_outcomes: [{ description: 'Financial controls', quote: mockWebsiteData.testimonials?.[1] || '' }],
                    urgency_signals: [],
                    buying_behavior: { decision_speed: 'slow', research_intensity: 'high', price_sensitivity: 'high', relationship_vs_transactional: 'transactional' },
                    success_metrics: [],
                    sample_quotes: []
                  },
                  {
                    persona_name: 'Marketing Director',
                    role_title: 'Marketing Director',
                    role_seniority: 'Director',
                    company_type: 'SaaS',
                    company_size: '20-100',
                    industry: 'Technology',
                    pain_points: [],
                    desired_outcomes: [{ description: 'Better data', quote: mockWebsiteData.testimonials?.[2] || '' }],
                    urgency_signals: [],
                    buying_behavior: { decision_speed: 'medium', research_intensity: 'high', price_sensitivity: 'medium', relationship_vs_transactional: 'relationship' },
                    success_metrics: [],
                    sample_quotes: []
                  }
                ],
                common_pain_points: [],
                common_outcomes: ['scaling', 'controls', 'data'],
                industry_patterns: [],
                data_quality: 'good'
              })
            }
          }],
          usage: { prompt_tokens: 200, completion_tokens: 800 }
        },
        error: null
      });

      const result = await buyerIntelligenceExtractor.extractBuyerPersonas(mockWebsiteData);

      // Should extract multiple personas
      expect(result.personas.length).toBeGreaterThanOrEqual(3);

      // Each persona should have required fields
      result.personas.forEach(persona => {
        expect(persona).toHaveProperty('id');
        expect(persona).toHaveProperty('persona_name');
        expect(persona).toHaveProperty('role');
        expect(persona).toHaveProperty('company_context');
        expect(persona).toHaveProperty('pain_points');
        expect(persona).toHaveProperty('desired_outcomes');
      });
    });

    it('should extract common patterns across personas', async () => {
      const mockWebsiteData = {
        url: 'https://example.com',
        content: 'Consulting services',
        testimonials: createMockTestimonials()
      };

      (supabase.functions.invoke as any).mockResolvedValue({
        data: {
          choices: [{
            message: {
              content: JSON.stringify({
                personas: [{
                  persona_name: 'Business Owner',
                  role_title: 'Owner',
                  role_seniority: 'Executive',
                  company_type: 'SMB',
                  company_size: '1-20',
                  industry: 'General',
                  pain_points: [{ description: 'Time management', category: 'time', intensity: 'high', quote: '' }],
                  desired_outcomes: [{ description: 'Efficiency', quote: '' }],
                  urgency_signals: [],
                  buying_behavior: { decision_speed: 'medium', research_intensity: 'medium', price_sensitivity: 'medium', relationship_vs_transactional: 'relationship' },
                  success_metrics: [],
                  sample_quotes: []
                }],
                common_pain_points: ['time management', 'scaling challenges', 'cost control'],
                common_outcomes: ['efficiency', 'growth', 'savings'],
                industry_patterns: ['SMB growth patterns', 'Founder-led challenges'],
                data_quality: 'good'
              })
            }
          }],
          usage: { prompt_tokens: 150, completion_tokens: 400 }
        },
        error: null
      });

      const result = await buyerIntelligenceExtractor.extractBuyerPersonas(mockWebsiteData);

      // Should extract common patterns
      expect(result.common_pain_points).toBeDefined();
      expect(result.common_outcomes).toBeDefined();
      expect(result.industry_patterns).toBeDefined();

      expect(Array.isArray(result.common_pain_points)).toBe(true);
      expect(Array.isArray(result.common_outcomes)).toBe(true);
      expect(Array.isArray(result.industry_patterns)).toBe(true);
    });
  });
});
