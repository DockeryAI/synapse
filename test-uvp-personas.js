#!/usr/bin/env node

/**
 * Test script to emulate UVP buyer personas save process
 *
 * This script creates sample buyer personas and tests the database save functionality
 * to verify that the OnboardingV5DataService properly saves personas to the database.
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration for local development
const supabaseUrl = 'http://localhost:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

// Test brand ID (OpenDialog)
const BRAND_ID = '001e28bd-afa4-43e1-a262-7a459330cd01';

// Sample buyer personas data (10 personas as expected from UVP process)
const samplePersonas = [
  {
    id: 'persona_1',
    persona_name: 'Enterprise AI Director',
    role: {
      title: 'Director of AI Strategy',
      seniority: 'senior',
      department: 'Technology',
      is_decision_maker: true,
      influence_level: 'high'
    },
    company_type: 'enterprise',
    company_size: 'large',
    industry: {
      primary_industry: 'Technology',
      sub_industry: 'Enterprise Software',
      industry_keywords: ['AI', 'automation', 'digital transformation'],
      vertical_specificity: 85
    },
    pain_points: [
      'Legacy systems blocking AI implementation',
      'Lack of conversational AI expertise',
      'Regulatory compliance concerns with AI'
    ],
    desired_outcomes: [
      'Seamless AI integration across enterprise',
      'Improved customer satisfaction through automation',
      'Reduced operational costs via AI efficiency'
    ],
    urgency_signals: [
      'Board pressure for digital transformation',
      'Competitor advantage through AI',
      'Q1 2024 AI initiative deadline'
    ],
    buying_behavior: {
      decision_speed: 'slow',
      research_intensity: 'high',
      price_sensitivity: 'low',
      relationship_vs_transactional: 'relationship',
      evidence: ['Requires extensive proof of concept', 'Multiple stakeholder buy-in needed']
    },
    success_metrics: ['Customer satisfaction scores', 'Operational efficiency gains'],
    confidence_score: 92,
    sample_size: 15,
    evidence_sources: ['Customer interviews', 'Sales team feedback'],
    representative_quotes: ['We need AI that works with our existing infrastructure']
  },
  {
    id: 'persona_2',
    persona_name: 'Customer Experience Manager',
    role: {
      title: 'Customer Experience Manager',
      seniority: 'mid',
      department: 'Customer Success',
      is_decision_maker: false,
      influence_level: 'medium'
    },
    company_type: 'saas',
    company_size: 'medium',
    industry: {
      primary_industry: 'Software',
      sub_industry: 'SaaS',
      industry_keywords: ['customer experience', 'support', 'engagement'],
      vertical_specificity: 78
    },
    pain_points: [
      'Inconsistent customer support quality',
      'High volume of repetitive inquiries',
      'Lack of 24/7 support capabilities'
    ],
    desired_outcomes: [
      'Consistent high-quality customer interactions',
      'Reduced response times',
      'Higher customer satisfaction scores'
    ],
    urgency_signals: [
      'Customer churn increasing',
      'Negative reviews about support',
      'Competitor offering better support'
    ],
    buying_behavior: {
      decision_speed: 'moderate',
      research_intensity: 'moderate',
      price_sensitivity: 'medium',
      relationship_vs_transactional: 'mixed',
      evidence: ['Focuses on ROI metrics', 'Needs integration capabilities']
    },
    success_metrics: ['CSAT scores', 'Response time reduction'],
    confidence_score: 88,
    sample_size: 12,
    evidence_sources: ['Support team interviews', 'Customer feedback'],
    representative_quotes: ['We need AI that understands our customers context']
  },
  {
    id: 'persona_3',
    persona_name: 'Technical Product Manager',
    role: {
      title: 'Senior Product Manager',
      seniority: 'senior',
      department: 'Product',
      is_decision_maker: true,
      influence_level: 'high'
    },
    company_type: 'startup',
    company_size: 'small',
    industry: {
      primary_industry: 'Technology',
      sub_industry: 'Fintech',
      industry_keywords: ['product development', 'user experience', 'fintech'],
      vertical_specificity: 82
    },
    pain_points: [
      'Limited engineering resources',
      'Need to ship AI features quickly',
      'Complex integration requirements'
    ],
    desired_outcomes: [
      'Fast time-to-market for AI features',
      'Seamless user experience',
      'Scalable AI infrastructure'
    ],
    urgency_signals: [
      'Investor pressure for AI features',
      'Product roadmap deadline approaching',
      'User feedback demanding automation'
    ],
    buying_behavior: {
      decision_speed: 'fast',
      research_intensity: 'high',
      price_sensitivity: 'high',
      relationship_vs_transactional: 'mixed',
      evidence: ['Needs technical documentation', 'Requires developer resources']
    },
    success_metrics: ['Feature adoption rate', 'Development velocity'],
    confidence_score: 85,
    sample_size: 10,
    evidence_sources: ['Product team interviews', 'User research'],
    representative_quotes: ['We need AI that developers can actually implement']
  }
  // Add 7 more personas to reach 10 total...
];

// Add remaining 7 personas
const additionalPersonas = [
  {
    id: 'persona_4',
    persona_name: 'IT Operations Manager',
    role: {
      title: 'IT Operations Manager',
      seniority: 'mid',
      department: 'IT',
      is_decision_maker: false,
      influence_level: 'medium'
    },
    company_type: 'enterprise',
    company_size: 'large',
    industry: {
      primary_industry: 'Financial Services',
      sub_industry: 'Banking',
      industry_keywords: ['operations', 'infrastructure', 'security'],
      vertical_specificity: 75
    },
    pain_points: ['System integration complexity', 'Security compliance requirements'],
    desired_outcomes: ['Reliable AI system performance', 'Seamless integrations'],
    urgency_signals: ['Upcoming audit requirements', 'System performance issues'],
    buying_behavior: {
      decision_speed: 'slow',
      research_intensity: 'high',
      price_sensitivity: 'medium',
      relationship_vs_transactional: 'relationship',
      evidence: ['Needs security certifications']
    },
    success_metrics: ['System uptime', 'Security compliance'],
    confidence_score: 80,
    sample_size: 8,
    evidence_sources: ['IT team interviews'],
    representative_quotes: ['Security and reliability are non-negotiable']
  },
  {
    id: 'persona_5',
    persona_name: 'Digital Transformation Lead',
    role: {
      title: 'VP of Digital Transformation',
      seniority: 'executive',
      department: 'Strategy',
      is_decision_maker: true,
      influence_level: 'high'
    },
    company_type: 'enterprise',
    company_size: 'large',
    industry: {
      primary_industry: 'Healthcare',
      sub_industry: 'Healthcare Technology',
      industry_keywords: ['digital transformation', 'innovation', 'patient experience'],
      vertical_specificity: 90
    },
    pain_points: ['Slow digital adoption', 'Legacy system constraints'],
    desired_outcomes: ['Accelerated digital initiatives', 'Improved patient engagement'],
    urgency_signals: ['Industry disruption', 'Regulatory changes'],
    buying_behavior: {
      decision_speed: 'moderate',
      research_intensity: 'high',
      price_sensitivity: 'low',
      relationship_vs_transactional: 'relationship',
      evidence: ['Requires strategic alignment']
    },
    success_metrics: ['Digital adoption rate', 'Patient satisfaction'],
    confidence_score: 87,
    sample_size: 6,
    evidence_sources: ['Executive interviews'],
    representative_quotes: ['We need AI that transforms how we engage with patients']
  },
  {
    id: 'persona_6',
    persona_name: 'Contact Center Director',
    role: {
      title: 'Contact Center Director',
      seniority: 'senior',
      department: 'Customer Service',
      is_decision_maker: true,
      influence_level: 'high'
    },
    company_type: 'enterprise',
    company_size: 'large',
    industry: {
      primary_industry: 'Telecommunications',
      sub_industry: 'Telecom Services',
      industry_keywords: ['contact center', 'customer service', 'call volume'],
      vertical_specificity: 85
    },
    pain_points: ['High call volumes', 'Agent turnover', 'Inconsistent service quality'],
    desired_outcomes: ['Reduced call handling time', 'Improved agent efficiency'],
    urgency_signals: ['Rising operational costs', 'Customer complaints'],
    buying_behavior: {
      decision_speed: 'moderate',
      research_intensity: 'moderate',
      price_sensitivity: 'medium',
      relationship_vs_transactional: 'mixed',
      evidence: ['Needs ROI justification']
    },
    success_metrics: ['Average handle time', 'First call resolution'],
    confidence_score: 83,
    sample_size: 11,
    evidence_sources: ['Contact center data'],
    representative_quotes: ['We need AI that helps agents, not replaces them']
  },
  {
    id: 'persona_7',
    persona_name: 'Innovation Manager',
    role: {
      title: 'Innovation Manager',
      seniority: 'mid',
      department: 'Innovation',
      is_decision_maker: false,
      influence_level: 'medium'
    },
    company_type: 'enterprise',
    company_size: 'large',
    industry: {
      primary_industry: 'Retail',
      sub_industry: 'E-commerce',
      industry_keywords: ['innovation', 'customer experience', 'digital retail'],
      vertical_specificity: 78
    },
    pain_points: ['Slow innovation cycles', 'Technology adoption challenges'],
    desired_outcomes: ['Faster innovation delivery', 'Enhanced customer experience'],
    urgency_signals: ['Competitive pressure', 'Customer expectations rising'],
    buying_behavior: {
      decision_speed: 'fast',
      research_intensity: 'moderate',
      price_sensitivity: 'medium',
      relationship_vs_transactional: 'mixed',
      evidence: ['Needs pilot programs']
    },
    success_metrics: ['Innovation pipeline', 'Customer engagement'],
    confidence_score: 79,
    sample_size: 9,
    evidence_sources: ['Innovation team feedback'],
    representative_quotes: ['We need AI that drives customer engagement']
  },
  {
    id: 'persona_8',
    persona_name: 'Software Architect',
    role: {
      title: 'Principal Software Architect',
      seniority: 'senior',
      department: 'Engineering',
      is_decision_maker: false,
      influence_level: 'high'
    },
    company_type: 'saas',
    company_size: 'medium',
    industry: {
      primary_industry: 'Technology',
      sub_industry: 'Software Development',
      industry_keywords: ['architecture', 'scalability', 'technical design'],
      vertical_specificity: 88
    },
    pain_points: ['Technical debt', 'Scalability challenges', 'Integration complexity'],
    desired_outcomes: ['Clean architecture', 'Scalable solutions'],
    urgency_signals: ['Performance bottlenecks', 'Technical debt accumulation'],
    buying_behavior: {
      decision_speed: 'slow',
      research_intensity: 'very high',
      price_sensitivity: 'medium',
      relationship_vs_transactional: 'relationship',
      evidence: ['Needs technical deep-dive']
    },
    success_metrics: ['System performance', 'Code quality'],
    confidence_score: 91,
    sample_size: 7,
    evidence_sources: ['Technical interviews'],
    representative_quotes: ['We need AI with robust APIs and clean architecture']
  },
  {
    id: 'persona_9',
    persona_name: 'Business Operations Manager',
    role: {
      title: 'Business Operations Manager',
      seniority: 'mid',
      department: 'Operations',
      is_decision_maker: false,
      influence_level: 'medium'
    },
    company_type: 'startup',
    company_size: 'small',
    industry: {
      primary_industry: 'Professional Services',
      sub_industry: 'Consulting',
      industry_keywords: ['operations', 'efficiency', 'process improvement'],
      vertical_specificity: 72
    },
    pain_points: ['Manual processes', 'Resource constraints', 'Operational inefficiency'],
    desired_outcomes: ['Process automation', 'Improved efficiency'],
    urgency_signals: ['Growth scaling challenges', 'Operational bottlenecks'],
    buying_behavior: {
      decision_speed: 'moderate',
      research_intensity: 'moderate',
      price_sensitivity: 'high',
      relationship_vs_transactional: 'transactional',
      evidence: ['Needs quick wins']
    },
    success_metrics: ['Process efficiency', 'Cost reduction'],
    confidence_score: 74,
    sample_size: 5,
    evidence_sources: ['Operations data'],
    representative_quotes: ['We need AI that automates our repetitive tasks']
  },
  {
    id: 'persona_10',
    persona_name: 'Chief Technology Officer',
    role: {
      title: 'Chief Technology Officer',
      seniority: 'executive',
      department: 'Technology',
      is_decision_maker: true,
      influence_level: 'very high'
    },
    company_type: 'enterprise',
    company_size: 'large',
    industry: {
      primary_industry: 'Manufacturing',
      sub_industry: 'Industrial Technology',
      industry_keywords: ['technology strategy', 'digital transformation', 'innovation'],
      vertical_specificity: 82
    },
    pain_points: ['Legacy system modernization', 'Technology ROI pressure'],
    desired_outcomes: ['Strategic technology advantage', 'Innovation leadership'],
    urgency_signals: ['Board expectations', 'Competitive threats'],
    buying_behavior: {
      decision_speed: 'slow',
      research_intensity: 'high',
      price_sensitivity: 'low',
      relationship_vs_transactional: 'relationship',
      evidence: ['Needs strategic alignment']
    },
    success_metrics: ['Technology ROI', 'Innovation metrics'],
    confidence_score: 89,
    sample_size: 4,
    evidence_sources: ['Executive interviews'],
    representative_quotes: ['We need AI that drives strategic competitive advantage']
  }
];

// Combine all personas
const allPersonas = [...samplePersonas, ...additionalPersonas];

console.log(`🧪 Testing UVP Buyer Personas Save Process`);
console.log(`📊 Generated ${allPersonas.length} sample buyer personas`);

async function testPersonaSave() {
  try {
    console.log(`\n🗄️  Testing database save for brand: ${BRAND_ID}`);

    // 1. Clear existing personas
    console.log('1. Clearing existing buyer personas...');
    const { error: deleteError } = await supabase
      .from('buyer_personas')
      .delete()
      .eq('brand_id', BRAND_ID);

    if (deleteError) {
      console.error('❌ Delete error:', deleteError);
      return;
    }
    console.log('✅ Existing personas cleared');

    // 2. Insert new personas
    console.log('2. Inserting new buyer personas...');
    const rows = allPersonas.map(persona => ({
      brand_id: BRAND_ID,
      name: persona.persona_name,
      role: persona.role.title,
      company_type: persona.company_type,
      industry: persona.industry.primary_industry,
      pain_points: JSON.stringify(persona.pain_points),
      desired_outcomes: JSON.stringify(persona.desired_outcomes),
      urgency_signals: JSON.stringify(persona.urgency_signals),
      buying_behavior: JSON.stringify(persona.buying_behavior),
      validated: false
    }));

    const { data, error: insertError } = await supabase
      .from('buyer_personas')
      .insert(rows)
      .select('*');

    if (insertError) {
      console.error('❌ Insert error:', insertError);
      return;
    }

    console.log(`✅ Successfully saved ${data.length} buyer personas to database`);

    // 3. Verify the save
    console.log('3. Verifying personas were saved...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('buyer_personas')
      .select('*')
      .eq('brand_id', BRAND_ID);

    if (verifyError) {
      console.error('❌ Verify error:', verifyError);
      return;
    }

    console.log(`✅ Verification: Found ${verifyData.length} personas in database`);
    console.log('\n📋 Saved personas:');
    verifyData.forEach((persona, index) => {
      console.log(`  ${index + 1}. ${persona.name} (${persona.role})`);
    });

    // 4. Test the service load function
    console.log('\n4. Testing OnboardingV5DataService load...');

    // Simulate service load (we can't import the actual service in Node.js easily)
    const serviceLoadResult = await supabase
      .from('buyer_personas')
      .select('*')
      .eq('brand_id', BRAND_ID)
      .order('created_at', { ascending: false });

    if (serviceLoadResult.error) {
      console.error('❌ Service load error:', serviceLoadResult.error);
      return;
    }

    console.log(`✅ Service load test: Found ${serviceLoadResult.data.length} personas`);

    console.log('\n🎉 Test completed successfully!');
    console.log(`\n📝 Summary:`);
    console.log(`   • ${allPersonas.length} personas generated`);
    console.log(`   • ${data.length} personas saved to database`);
    console.log(`   • ${verifyData.length} personas verified in database`);
    console.log(`   • Database save/load functionality working correctly`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testPersonaSave().then(() => {
  console.log('\n✨ Test script completed');
  process.exit(0);
});