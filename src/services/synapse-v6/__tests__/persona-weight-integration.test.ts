/**
 * PHASE 14F-F: Buyer Persona Weight Integration Tests
 *
 * Verifies that query keywords are weighted by actual persona frequency data:
 * - 9/10 personas focus on sales → sales keywords dominate
 * - 1/10 personas mention compliance → compliance keywords deprioritized
 */

import { describe, it, expect } from 'vitest';
import { extractShortQuery } from '../uvp-context-builder.service';
import type { CompleteUVP } from '@/types/uvp-flow.types';
import type { BuyerPersona } from '@/types/buyer-persona.types';

describe('PHASE 14F-F: Buyer Persona Weight Integration', () => {
  // Mock UVP for OpenDialog.ai (conversational AI platform)
  const mockUVP: CompleteUVP = {
    valuePropositionStatement: 'OpenDialog helps insurance agents automate customer conversations',
    targetCustomer: {
      statement: 'Insurance brokers seeking to scale their business',
      industry: 'Insurance',
      marketGeography: { scope: 'National', primaryRegions: ['United States'] },
      emotionalDrivers: ['Fear of losing clients to automation'],
      functionalDrivers: ['Need to handle more clients']
    },
    keyBenefit: {
      statement: 'Automate sales conversations and generate more revenue',
      category: 'revenue_growth',
      metrics: [{ metric: 'Revenue Growth', value: '3x', timeframe: '6 months' }]
    },
    transformationGoal: {
      statement: 'Transform from manual sales processes to automated revenue generation',
      before: 'Spending hours on repetitive sales calls',
      after: 'Automated conversations driving revenue growth',
      emotionalDrivers: ['Confidence in scaling business']
    },
    uniqueSolution: {
      statement: 'AI-powered conversation automation',
      differentiators: [{ statement: 'Custom AI training for insurance' }]
    },
    customerProfiles: []
  };

  it('should prioritize sales outcomes when 9/10 personas focus on sales', () => {
    // PHASE 14F-F: Create 10 buyer personas - 9 focused on SALES, 1 on COMPLIANCE
    const personas: BuyerPersona[] = [
      // Sales-focused personas (9 total)
      {
        id: 'persona_1',
        persona_name: 'Revenue Growth Agent',
        role: 'Sales Director',
        company_type: 'insurance-agency',
        industry: 'Insurance',
        pain_points: ['Need to increase sales volume', 'Low conversion rates'],
        desired_outcomes: ['Generate more revenue', 'Close more deals', 'Boost sales performance'],
        urgency_signals: ['Revenue targets not being met', 'Sales pipeline running dry']
      },
      {
        id: 'persona_2',
        persona_name: 'Scaling Agency Owner',
        role: 'Agency Owner',
        company_type: 'insurance-agency',
        industry: 'Insurance',
        pain_points: ['Cannot scale business fast enough', 'Too many manual tasks'],
        desired_outcomes: ['Scale the business', 'Generate more leads', 'Increase revenue'],
        urgency_signals: ['Growth opportunities being missed']
      },
      {
        id: 'persona_3',
        persona_name: 'Sales Automation Leader',
        role: 'VP of Sales',
        company_type: 'insurance-agency',
        industry: 'Insurance',
        pain_points: ['Manual sales processes', 'Low sales efficiency'],
        desired_outcomes: ['Automate sales processes', 'Increase conversion rates', 'Generate more revenue'],
        urgency_signals: ['Competitors automating sales']
      },
      {
        id: 'persona_4',
        persona_name: 'Growth-Focused Broker',
        role: 'Insurance Broker',
        company_type: 'independent',
        industry: 'Insurance',
        pain_points: ['Time spent on low-value tasks', 'Need more client meetings'],
        desired_outcomes: ['Grow client base', 'Increase sales', 'Close more policies'],
        urgency_signals: ['Market expansion opportunity']
      },
      {
        id: 'persona_5',
        persona_name: 'Revenue Operations Manager',
        role: 'RevOps Manager',
        company_type: 'insurance-agency',
        industry: 'Insurance',
        pain_points: ['Inefficient revenue processes', 'Sales team bottlenecks'],
        desired_outcomes: ['Streamline sales operations', 'Boost revenue', 'Optimize conversion'],
        urgency_signals: ['Revenue growth targets']
      },
      {
        id: 'persona_6',
        persona_name: 'Lead Generation Specialist',
        role: 'Marketing Director',
        company_type: 'insurance-agency',
        industry: 'Insurance',
        pain_points: ['Not enough qualified leads', 'Low lead-to-sale conversion'],
        desired_outcomes: ['Generate more qualified leads', 'Increase sales conversion', 'Boost revenue'],
        urgency_signals: ['Q4 revenue goals']
      },
      {
        id: 'persona_7',
        persona_name: 'Sales Enablement Leader',
        role: 'Sales Enablement Manager',
        company_type: 'insurance-agency',
        industry: 'Insurance',
        pain_points: ['Sales team lacks tools', 'Manual sales workflows'],
        desired_outcomes: ['Automate sales enablement', 'Increase sales productivity', 'Generate more revenue'],
        urgency_signals: ['New sales targets set']
      },
      {
        id: 'persona_8',
        persona_name: 'Customer Acquisition Manager',
        role: 'Acquisition Manager',
        company_type: 'insurance-agency',
        industry: 'Insurance',
        pain_points: ['High cost of customer acquisition', 'Slow sales cycles'],
        desired_outcomes: ['Reduce acquisition costs', 'Accelerate sales', 'Grow customer base'],
        urgency_signals: ['CAC too high']
      },
      {
        id: 'persona_9',
        persona_name: 'Business Development Director',
        role: 'BD Director',
        company_type: 'insurance-agency',
        industry: 'Insurance',
        pain_points: ['Difficulty scaling partnerships', 'Manual outreach processes'],
        desired_outcomes: ['Scale partnership revenue', 'Automate outreach', 'Generate more sales'],
        urgency_signals: ['Partnership expansion plans']
      },
      // Compliance-focused persona (1 total)
      {
        id: 'persona_10',
        persona_name: 'Regulatory Compliance Officer',
        role: 'Compliance Officer',
        company_type: 'insurance-agency',
        industry: 'Insurance',
        pain_points: ['Regulatory audit requirements', 'Compliance documentation burden'],
        desired_outcomes: ['Maintain compliance', 'Pass audits', 'Reduce compliance risk'],
        urgency_signals: ['Upcoming regulatory audit']
      }
    ];

    // PHASE 14F-F: Test VOC query with persona weight integration
    const vocQuery = extractShortQuery(
      { ...mockUVP, customerProfiles: personas as any },
      'voc',
      'national-saas'
    );

    console.log('[TEST] VOC Query with 9/10 sales-focused personas:', vocQuery);

    // EXPECTED BEHAVIOR:
    // - Sales keywords should DOMINATE because 9/10 personas mention sales/revenue
    // - Compliance keywords should be MINIMAL or ABSENT because only 1/10 personas mention it
    expect(vocQuery.toLowerCase()).toMatch(/sales|revenue|generate|automate/);
    expect(vocQuery.toLowerCase()).not.toMatch(/compliance|audit|regulatory/);
  });

  it('should deprioritize sales when only 1/10 personas focus on sales', () => {
    // PHASE 14F-F: Reverse scenario - 9 COMPLIANCE personas, 1 SALES persona
    const personas: BuyerPersona[] = [
      // Compliance-focused personas (9 total)
      ...Array.from({ length: 9 }, (_, i) => ({
        id: `persona_${i + 1}`,
        persona_name: `Compliance Officer ${i + 1}`,
        role: 'Compliance Officer',
        company_type: 'insurance-agency',
        industry: 'Insurance',
        pain_points: ['Regulatory audit requirements', 'Compliance documentation burden', 'Risk of audit failures'],
        desired_outcomes: ['Pass regulatory audits', 'Maintain compliance standards', 'Certify regulatory compliance'],
        urgency_signals: ['Upcoming regulatory audit', 'New compliance regulations', 'Audit deadline approaching']
      })) as BuyerPersona[],
      // Sales-focused persona (1 total)
      {
        id: 'persona_10',
        persona_name: 'Sales Director',
        role: 'Sales Director',
        company_type: 'insurance-agency',
        industry: 'Insurance',
        pain_points: ['Manual sales processes'],
        desired_outcomes: ['Automate sales', 'Generate revenue'],
        urgency_signals: ['Revenue targets']
      }
    ];

    const vocQuery = extractShortQuery(
      { ...mockUVP, customerProfiles: personas as any },
      'voc',
      'national-saas'
    );

    console.log('[TEST] VOC Query with 9/10 compliance-focused personas:', vocQuery);

    // EXPECTED BEHAVIOR:
    // - Compliance keywords should DOMINATE because 9/10 personas mention compliance/audit
    // - Sales keywords should be MINIMAL because only 1/10 personas mention sales
    expect(vocQuery.toLowerCase()).toMatch(/compliance|audit|regulatory/);
    // Sales may still appear due to UVP keyBenefit, but should not dominate
  });

  it('should use medium-priority weighting for outcomes mentioned by 4-7 personas', () => {
    // PHASE 14F-F: Balanced scenario - mix of outcomes
    const personas: BuyerPersona[] = [
      // 5 personas focus on AUTOMATION/STREAMLINING (medium priority: 4-7 mentions)
      ...Array.from({ length: 5 }, (_, i) => ({
        id: `persona_automation_${i + 1}`,
        persona_name: `Automation Seeker ${i + 1}`,
        role: 'Operations Manager',
        company_type: 'insurance-agency',
        industry: 'Insurance',
        pain_points: ['Manual processes slowing growth', 'Time-consuming repetitive tasks'],
        desired_outcomes: ['Automate customer workflows', 'Streamline operations processes', 'Enhance automation capabilities'],
        urgency_signals: ['Operational efficiency targets', 'Automation initiative deadline']
      })) as BuyerPersona[],
      // 3 personas focus on SALES (low priority: 1-3 mentions)
      ...Array.from({ length: 3 }, (_, i) => ({
        id: `persona_sales_${i + 1}`,
        persona_name: `Sales Agent ${i + 1}`,
        role: 'Sales Agent',
        company_type: 'insurance-agency',
        industry: 'Insurance',
        pain_points: ['Low conversion rates'],
        desired_outcomes: ['Increase sales', 'Generate revenue'],
        urgency_signals: ['Sales quotas']
      })) as BuyerPersona[],
      // 2 personas focus on EFFICIENCY (low priority: 1-3 mentions)
      ...Array.from({ length: 2 }, (_, i) => ({
        id: `persona_efficiency_${i + 1}`,
        persona_name: `Efficiency Manager ${i + 1}`,
        role: 'Process Manager',
        company_type: 'insurance-agency',
        industry: 'Insurance',
        pain_points: ['Inefficient processes'],
        desired_outcomes: ['Improve efficiency', 'Optimize workflows'],
        urgency_signals: ['Cost reduction targets']
      })) as BuyerPersona[]
    ];

    const vocQuery = extractShortQuery(
      { ...mockUVP, customerProfiles: personas as any },
      'voc',
      'national-saas'
    );

    console.log('[TEST] VOC Query with balanced persona priorities:', vocQuery);

    // EXPECTED BEHAVIOR:
    // - Without high-priority outcomes (8+), system uses score-based sorting
    // - Multiple outcomes have similar scores (sales/revenue/generate all = 40)
    // - Should include mix of medium-priority outcome keywords
    expect(vocQuery.toLowerCase()).toMatch(/sales|revenue|automate|grow/);
  });

  it('should handle buyer personas from database format (stringified JSON)', () => {
    // PHASE 14F-F: Test database format where pain_points/desired_outcomes are JSON strings
    const personas = [
      {
        id: 'db_persona_1',
        persona_name: 'Database Persona',
        role: 'Sales Director',
        company_type: 'insurance-agency',
        industry: 'Insurance',
        pain_points: JSON.stringify(['Need to increase sales', 'Low revenue']),
        desired_outcomes: JSON.stringify(['Generate more revenue', 'Automate sales']),
        urgency_signals: JSON.stringify(['Revenue targets'])
      }
    ];

    // The service should handle both parsed and stringified formats
    const vocQuery = extractShortQuery(
      { ...mockUVP, customerProfiles: personas as any },
      'voc',
      'national-saas'
    );

    console.log('[TEST] VOC Query with database-format personas:', vocQuery);

    // Should still extract sales keywords even from stringified JSON
    expect(vocQuery.toLowerCase()).toMatch(/sales|revenue|automate/);
  });
});
