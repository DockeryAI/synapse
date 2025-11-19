/**
 * Target Customer Extractor Service Tests
 *
 * Tests for evidence-based customer profile extraction
 *
 * Created: 2025-11-18
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractTargetCustomer } from '@/services/uvp-extractors/customer-extractor.service';

// Mock environment variables
vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-key');

// Mock global fetch
global.fetch = vi.fn();

describe('CustomerExtractorService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('extractTargetCustomer', () => {
    it('should extract customer profiles from testimonials with evidence', async () => {
      const testimonials = [
        "As a marketing director at a fast-growing SaaS startup, I was drowning in data",
        "I'm responsible for marketing at a 50-person software company",
        "We're a B2B SaaS business serving mid-market companies"
      ];

      const mockResponse = {
        profiles: [
          {
            statement: "Marketing Directors at B2B SaaS companies with 20-100 employees",
            industry: "B2B SaaS / Technology",
            company_size: "20-100 employees",
            role: "Marketing Director / VP Marketing",
            evidence_quotes: [
              "As a marketing director at a fast-growing SaaS startup, I was drowning in data",
              "I'm responsible for marketing at a 50-person software company",
              "We're a B2B SaaS business serving mid-market companies"
            ],
            confidence_level: "high",
            source_sections: ["testimonials"]
          }
        ],
        overall_confidence: "high",
        data_quality: "excellent",
        warnings: []
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify(mockResponse)
            }
          }]
        })
      });

      const result = await extractTargetCustomer(
        ['Website content about B2B SaaS solutions'],
        testimonials,
        [],
        'TestBiz'
      );

      // Should extract profile successfully
      expect(result.profiles).toBeDefined();
      expect(result.profiles.length).toBe(1);

      const profile = result.profiles[0];
      expect(profile.statement).toBe("Marketing Directors at B2B SaaS companies with 20-100 employees");
      expect(profile.industry).toBe("B2B SaaS / Technology");
      expect(profile.companySize).toBe("20-100 employees");
      expect(profile.role).toBe("Marketing Director / VP Marketing");
      expect(profile.evidenceQuotes?.length).toBe(3);
      expect(profile.isManualInput).toBe(false);

      // Confidence should be high
      expect(profile.confidence?.overall).toBeGreaterThan(70);

      // Should have evidence quotes
      expect(result.evidenceQuotes.length).toBeGreaterThan(0);

      // Should have sources
      expect(result.sources.length).toBeGreaterThan(0);
    });

    it('should return empty result when no clear evidence is found', async () => {
      const mockResponse = {
        profiles: [],
        overall_confidence: "low",
        data_quality: "poor",
        warnings: ["No explicit customer mentions found in content"]
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify(mockResponse)
            }
          }]
        })
      });

      const result = await extractTargetCustomer(
        ['Generic marketing content without customer mentions'],
        [],
        [],
        'TestBiz'
      );

      // Should return empty profiles
      expect(result.profiles).toBeDefined();
      expect(result.profiles.length).toBe(0);

      // Confidence should be low
      expect(result.confidence.overall).toBe(0);

      // Should explain why in reasoning
      expect(result.confidence.reasoning).toContain('No target customer');
    });

    it('should handle multiple distinct customer profiles', async () => {
      const mockResponse = {
        profiles: [
          {
            statement: "Marketing Directors at B2B SaaS companies",
            industry: "B2B SaaS",
            company_size: "20-100 employees",
            role: "Marketing Director",
            evidence_quotes: [
              "As a marketing director at a SaaS company...",
              "I manage marketing for a 50-person software business..."
            ],
            confidence_level: "high",
            source_sections: ["testimonials"]
          },
          {
            statement: "CEOs of early-stage startups",
            industry: "Technology / Startups",
            company_size: "1-20 employees",
            role: "CEO / Founder",
            evidence_quotes: [
              "As a startup CEO, I needed...",
              "I'm the founder of an early-stage company..."
            ],
            confidence_level: "high",
            source_sections: ["case_studies"]
          }
        ],
        overall_confidence: "high",
        data_quality: "excellent",
        warnings: []
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify(mockResponse)
            }
          }]
        })
      });

      const result = await extractTargetCustomer(
        ['Website content'],
        ['Marketing director testimonial'],
        ['CEO case study'],
        'TestBiz'
      );

      // Should extract both profiles
      expect(result.profiles.length).toBe(2);

      // Should have different roles
      const roles = result.profiles.map(p => p.role);
      expect(roles).toContain("Marketing Director");
      expect(roles).toContain("CEO / Founder");

      // Each should have evidence
      result.profiles.forEach(profile => {
        expect(profile.evidenceQuotes?.length).toBeGreaterThan(0);
      });
    });

    it('should filter out profiles without sufficient evidence', async () => {
      const mockResponse = {
        profiles: [
          {
            statement: "Well-evidenced profile",
            industry: "Technology",
            company_size: "50-200",
            role: "CTO",
            evidence_quotes: [
              "Quote 1 with evidence",
              "Quote 2 with evidence",
              "Quote 3 with evidence"
            ],
            confidence_level: "high",
            source_sections: ["testimonials"]
          },
          {
            statement: "Poorly evidenced profile",
            industry: "Unknown",
            role: "Unknown",
            evidence_quotes: [], // No evidence!
            confidence_level: "low",
            source_sections: []
          }
        ],
        overall_confidence: "medium",
        data_quality: "fair",
        warnings: ["Second profile has no supporting evidence"]
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify(mockResponse)
            }
          }]
        })
      });

      const result = await extractTargetCustomer(
        ['Content'],
        ['Testimonial'],
        [],
        'TestBiz'
      );

      // Should only include well-evidenced profile
      expect(result.profiles.length).toBe(1);
      expect(result.profiles[0].statement).toBe("Well-evidenced profile");
      expect(result.profiles[0].evidenceQuotes?.length).toBe(3);
    });

    it('should handle API errors gracefully', async () => {
      (global.fetch as any).mockRejectedValue(new Error('API Error'));

      const result = await extractTargetCustomer(
        ['Content'],
        [],
        [],
        'TestBiz'
      );

      // Should return empty result
      expect(result.profiles.length).toBe(0);
      expect(result.confidence.overall).toBe(0);
    });

    it('should handle markdown-wrapped JSON responses', async () => {
      const jsonContent = {
        profiles: [{
          statement: "Test profile",
          evidence_quotes: ["Quote 1", "Quote 2"],
          confidence_level: "medium",
          source_sections: ["testimonials"]
        }],
        overall_confidence: "medium",
        data_quality: "good",
        warnings: []
      };

      const markdownWrapped = '```json\n' + JSON.stringify(jsonContent) + '\n```';

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: markdownWrapped
            }
          }]
        })
      });

      const result = await extractTargetCustomer(
        ['Content'],
        ['Testimonial'],
        [],
        'TestBiz'
      );

      // Should successfully parse markdown-wrapped JSON
      expect(result.profiles.length).toBe(1);
      expect(result.profiles[0].statement).toBe("Test profile");
    });

    it('should calculate confidence based on evidence richness', async () => {
      const richEvidenceResponse = {
        profiles: [{
          statement: "Rich evidence profile",
          industry: "Technology",
          company_size: "100-500",
          role: "VP Engineering",
          evidence_quotes: [
            "Quote 1", "Quote 2", "Quote 3", "Quote 4", "Quote 5"
          ],
          confidence_level: "high",
          source_sections: ["testimonials", "case_studies"]
        }],
        overall_confidence: "high",
        data_quality: "excellent",
        warnings: []
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify(richEvidenceResponse)
            }
          }]
        })
      });

      const result = await extractTargetCustomer(
        ['Content'],
        ['Testimonial'],
        ['Case study'],
        'TestBiz'
      );

      // Rich evidence should result in high confidence
      expect(result.confidence.overall).toBeGreaterThan(80);
      expect(result.profiles[0].confidence?.dataQuality).toBeGreaterThan(80);
    });

    it('should deduplicate evidence quotes across profiles', async () => {
      const mockResponse = {
        profiles: [
          {
            statement: "Profile 1",
            evidence_quotes: ["Quote A", "Quote B", "Quote C"],
            confidence_level: "high",
            source_sections: ["testimonials"]
          },
          {
            statement: "Profile 2",
            evidence_quotes: ["Quote B", "Quote C", "Quote D"], // Some overlap
            confidence_level: "high",
            source_sections: ["testimonials"]
          }
        ],
        overall_confidence: "high",
        data_quality: "excellent",
        warnings: []
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify(mockResponse)
            }
          }]
        })
      });

      const result = await extractTargetCustomer(
        ['Content'],
        ['Testimonial'],
        [],
        'TestBiz'
      );

      // Should deduplicate quotes in evidenceQuotes array
      const uniqueQuotes = new Set(result.evidenceQuotes);
      expect(uniqueQuotes.size).toBe(result.evidenceQuotes.length);

      // Should have 4 unique quotes (A, B, C, D)
      expect(result.evidenceQuotes.length).toBe(4);
    });
  });
});
