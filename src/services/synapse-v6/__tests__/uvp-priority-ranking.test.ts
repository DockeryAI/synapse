/**
 * PHASE 14F: UVP Priority Ranking Engine Tests
 *
 * Tests that dynamic outcome detection prioritizes business outcomes
 * (sales, revenue) over edge cases (compliance, audit)
 */

import { describe, it, expect } from 'vitest';
import { extractShortQuery } from '../uvp-context-builder.service';
import type { CompleteUVP, CustomerProfile } from '@/types/uvp-flow.types';

describe('Phase 14F: UVP Priority Ranking Engine', () => {
  /**
   * OpenDialog.ai test case: AI agent for insurance sales
   * Should prioritize "sales automation" over "compliance audit"
   */
  it('should prioritize sales outcomes over compliance for OpenDialog.ai', () => {
    const mockUVP: CompleteUVP = {
      id: 'test-uvp-1',
      targetCustomer: {
        id: 'tc-1',
        statement: 'Insurance brokers and agencies seeking to modernize sales',
        industry: 'Insurance Technology',
        confidence: { level: 'high', score: 0.9 },
        sources: [],
        evidenceQuotes: [],
        isManualInput: false
      },
      transformationGoal: {
        id: 'tg-1',
        statement: 'Transform insurance sales process with AI automation',
        emotionalDrivers: ['Fear of losing sales to competitors', 'Desire to increase revenue'],
        functionalDrivers: ['Need to automate lead qualification', 'Must improve sales conversion'],
        eqScore: { emotional: 70, rational: 80, overall: 75 },
        confidence: { level: 'high', score: 0.9 },
        sources: [],
        customerQuotes: [],
        isManualInput: false
      },
      uniqueSolution: {
        id: 'us-1',
        statement: 'AI agent platform for insurance sales with explainable compliance features',
        differentiators: [
          {
            id: 'd-1',
            statement: 'First explainable AI for insurance sales',
            evidence: 'Transparent decision-making for regulated industries',
            source: { type: 'website', name: 'Website', url: 'https://opendialog.ai' },
            strengthScore: 85
          }
        ],
        confidence: { level: 'high', score: 0.9 },
        sources: [],
        isManualInput: false
      },
      keyBenefit: {
        id: 'kb-1',
        statement: 'Generate 3x more insurance sales while maintaining compliance',
        outcomeType: 'quantifiable',
        metrics: [
          {
            id: 'm-1',
            metric: 'Sales increase',
            value: '3x',
            timeframe: '6 months',
            source: { type: 'case_study', name: 'Case Study', url: 'https://opendialog.ai/case-studies' }
          }
        ],
        eqFraming: 'balanced',
        confidence: { level: 'high', score: 0.9 },
        sources: [],
        isManualInput: false
      },
      valuePropositionStatement: 'AI-powered sales automation for insurance agencies',
      whyStatement: 'To help insurance agents close more deals',
      whatStatement: 'AI sales agent platform',
      howStatement: 'Explainable AI that automates lead qualification and sales',
      createdAt: new Date(),
      updatedAt: new Date(),
      brand_profile_id: 'bp-1'
    };

    // Add 10 buyer personas with sales-focused language
    const buyerPersonas: CustomerProfile[] = [
      {
        id: 'p-1',
        statement: 'Insurance broker looking to generate more sales leads',
        emotionalDrivers: ['Desire to increase revenue', 'Fear of losing market share'],
        functionalDrivers: ['Need to automate sales process', 'Must improve conversion rates'],
        confidence: { level: 'high', score: 0.9 },
        sources: [],
        evidenceQuotes: [],
        isManualInput: false
      },
      {
        id: 'p-2',
        statement: 'Agency owner seeking to boost sales and grow business',
        emotionalDrivers: ['Desire for business growth', 'Fear of stagnation'],
        functionalDrivers: ['Need to scale sales operations', 'Must generate more revenue'],
        confidence: { level: 'high', score: 0.9 },
        sources: [],
        evidenceQuotes: [],
        isManualInput: false
      },
      {
        id: 'p-3',
        statement: 'Sales manager wanting to increase team sales performance',
        emotionalDrivers: ['Desire to exceed quotas', 'Fear of missing targets'],
        functionalDrivers: ['Need to improve sales efficiency', 'Must close more deals'],
        confidence: { level: 'high', score: 0.9 },
        sources: [],
        evidenceQuotes: [],
        isManualInput: false
      },
      {
        id: 'p-4',
        statement: 'Insurance professional focused on revenue growth and lead generation',
        emotionalDrivers: ['Desire for financial success', 'Fear of competitor advantage'],
        functionalDrivers: ['Need to generate qualified leads', 'Must increase sales volume'],
        confidence: { level: 'high', score: 0.9 },
        sources: [],
        evidenceQuotes: [],
        isManualInput: false
      },
      {
        id: 'p-5',
        statement: 'Broker seeking to automate sales process while maintaining compliance',
        emotionalDrivers: ['Desire for efficiency', 'Fear of regulatory issues'],
        functionalDrivers: ['Need sales automation', 'Must stay compliant'],
        confidence: { level: 'high', score: 0.9 },
        sources: [],
        evidenceQuotes: [],
        isManualInput: false
      },
      // Additional personas with mixed outcomes
      {
        id: 'p-6',
        statement: 'Agency executive wanting to convert more leads to sales',
        emotionalDrivers: ['Desire to grow market share'],
        functionalDrivers: ['Need better conversion rates'],
        confidence: { level: 'high', score: 0.9 },
        sources: [],
        evidenceQuotes: [],
        isManualInput: false
      },
      {
        id: 'p-7',
        statement: 'Sales director aiming to boost revenue through automation',
        emotionalDrivers: ['Desire for sales growth'],
        functionalDrivers: ['Need to automate sales workflows'],
        confidence: { level: 'high', score: 0.9 },
        sources: [],
        evidenceQuotes: [],
        isManualInput: false
      },
      {
        id: 'p-8',
        statement: 'Insurance business owner seeking to generate more qualified leads',
        emotionalDrivers: ['Desire to scale business'],
        functionalDrivers: ['Need lead generation system'],
        confidence: { level: 'high', score: 0.9 },
        sources: [],
        evidenceQuotes: [],
        isManualInput: false
      },
      {
        id: 'p-9',
        statement: 'Agency manager focused on increasing sales team productivity',
        emotionalDrivers: ['Desire for efficiency gains'],
        functionalDrivers: ['Need to improve sales metrics'],
        confidence: { level: 'high', score: 0.9 },
        sources: [],
        evidenceQuotes: [],
        isManualInput: false
      },
      {
        id: 'p-10',
        statement: 'Insurance consultant wanting to grow revenue with compliance-ready tools',
        emotionalDrivers: ['Desire for growth with safety'],
        functionalDrivers: ['Need revenue growth tools'],
        confidence: { level: 'high', score: 0.9 },
        sources: [],
        evidenceQuotes: [],
        isManualInput: false
      }
    ];

    mockUVP.customerProfiles = buyerPersonas;

    // Generate VoC tab query (PHASE 14F-E: now supports profileType parameter)
    const vocQuery = extractShortQuery(mockUVP, 'voc', 'national-saas');

    // Assertions
    console.log('Generated VoC Query:', vocQuery);

    // BEFORE fix would produce: "Insurance Technology compliance software audit platform"
    // AFTER fix should produce: "Insurance Technology AI sales automation lead generation"

    // Primary assertions: Should prioritize sales/revenue outcomes
    expect(vocQuery.toLowerCase()).toContain('sales');
    expect(vocQuery.toLowerCase()).not.toMatch(/^.*compliance.*audit/); // Compliance should NOT be first

    // Verify industry is included
    expect(vocQuery).toContain('Insurance Technology');

    // Should include sales-related terms over compliance-related terms
    const hasSalesTerms =
      vocQuery.toLowerCase().includes('sales') ||
      vocQuery.toLowerCase().includes('revenue') ||
      vocQuery.toLowerCase().includes('lead generation') ||
      vocQuery.toLowerCase().includes('automation');

    expect(hasSalesTerms).toBe(true);

    // Query should be within API length limits
    expect(vocQuery.length).toBeLessThanOrEqual(100);
  });

  /**
   * Edge case: Pure compliance software (no sales mentions)
   * Should correctly identify compliance as primary outcome
   */
  it('should correctly identify compliance as primary when it is the main outcome', () => {
    const complianceUVP: CompleteUVP = {
      id: 'test-uvp-2',
      targetCustomer: {
        id: 'tc-2',
        statement: 'Regulated financial institutions requiring audit readiness',
        industry: 'Financial Compliance Software',
        confidence: { level: 'high', score: 0.9 },
        sources: [],
        evidenceQuotes: [],
        isManualInput: false
      },
      transformationGoal: {
        id: 'tg-2',
        statement: 'Achieve compliance certification and pass audits',
        emotionalDrivers: ['Fear of regulatory penalties'],
        functionalDrivers: ['Need audit preparation'],
        eqScore: { emotional: 60, rational: 90, overall: 75 },
        confidence: { level: 'high', score: 0.9 },
        sources: [],
        customerQuotes: [],
        isManualInput: false
      },
      uniqueSolution: {
        id: 'us-2',
        statement: 'Automated compliance audit platform',
        differentiators: [],
        confidence: { level: 'high', score: 0.9 },
        sources: [],
        isManualInput: false
      },
      keyBenefit: {
        id: 'kb-2',
        statement: 'Pass compliance audits on first attempt',
        outcomeType: 'qualitative',
        eqFraming: 'rational',
        confidence: { level: 'high', score: 0.9 },
        sources: [],
        isManualInput: false
      },
      valuePropositionStatement: 'Compliance audit automation',
      whyStatement: 'To ensure regulatory compliance',
      whatStatement: 'Audit readiness platform',
      howStatement: 'Automated compliance checks',
      createdAt: new Date(),
      updatedAt: new Date(),
      brand_profile_id: 'bp-2'
    };

    const vocQuery = extractShortQuery(complianceUVP, 'voc', 'national-saas');

    console.log('Compliance-focused VoC Query:', vocQuery);

    // For pure compliance software, compliance terms are appropriate
    expect(vocQuery.toLowerCase()).toContain('compliance');
    expect(vocQuery.length).toBeLessThanOrEqual(100);
  });
});
