/**
 * Generate Buyer Personas from existing UVP data
 *
 * This script creates buyer personas based on the UVP data that's already
 * in the marba_uvps table and saves them to the buyer_personas table.
 */

const brandId = '001e28bd-afa4-43e1-a262-7a459330cd01'; // OpenDialog brand ID

// Sample buyer personas based on the existing OpenDialog UVP
const buyerPersonas = [
  {
    persona_name: 'Digital Transformation Leaders',
    role: {
      title: 'Chief Digital Officer',
      seniority_level: 'Executive',
      department: 'Digital Strategy',
      decision_making_authority: 'Final Decision Maker'
    },
    company_type: 'Enterprise (1000+ employees)',
    industry: {
      primary_industry: 'Technology Services',
      sub_industry: 'Digital Innovation'
    },
    pain_points: [
      {
        description: 'Struggling to implement AI solutions that actually deliver business value',
        emotional_impact: 'Frustrated with vendor promises vs reality',
        urgency: 85
      },
      {
        description: 'Pressure from board to show ROI on digital transformation initiatives',
        emotional_impact: 'Anxious about career implications if initiatives fail',
        urgency: 90
      }
    ],
    desired_outcomes: [
      {
        outcome: 'Successful AI implementation with measurable business impact',
        functional_benefit: 'Increased operational efficiency and revenue growth',
        timeline: '6-12 months'
      },
      {
        outcome: 'Board-level credibility for digital initiatives',
        functional_benefit: 'Continued investment and support for transformation',
        timeline: '3-6 months'
      }
    ],
    brand_id: brandId
  },
  {
    persona_name: 'Customer Experience Innovators',
    role: {
      title: 'VP of Customer Experience',
      seniority_level: 'Senior Management',
      department: 'Customer Success',
      decision_making_authority: 'Budget Influencer'
    },
    company_type: 'Mid-market (200-999 employees)',
    industry: {
      primary_industry: 'Technology Services',
      sub_industry: 'Customer Experience'
    },
    pain_points: [
      {
        description: 'Customer interactions feel impersonal and scripted',
        emotional_impact: 'Concerned about losing customers to competitors with better CX',
        urgency: 80
      },
      {
        description: 'Difficulty measuring and improving conversational AI effectiveness',
        emotional_impact: 'Uncertain about ROI of AI investments',
        urgency: 75
      }
    ],
    desired_outcomes: [
      {
        outcome: 'More natural, engaging customer conversations',
        functional_benefit: 'Higher customer satisfaction and retention rates',
        timeline: '3-6 months'
      },
      {
        outcome: 'Data-driven insights into conversation quality',
        functional_benefit: 'Ability to optimize and improve AI interactions',
        timeline: '1-3 months'
      }
    ],
    brand_id: brandId
  },
  {
    persona_name: 'IT Architecture Decision Makers',
    role: {
      title: 'Chief Technology Officer',
      seniority_level: 'Executive',
      department: 'Information Technology',
      decision_making_authority: 'Final Decision Maker'
    },
    company_type: 'Enterprise (1000+ employees)',
    industry: {
      primary_industry: 'Technology Services',
      sub_industry: 'Enterprise Architecture'
    },
    pain_points: [
      {
        description: 'Legacy systems blocking AI innovation initiatives',
        emotional_impact: 'Frustrated by technical debt limiting strategic options',
        urgency: 85
      },
      {
        description: 'Vendor lock-in concerns with AI platform decisions',
        emotional_impact: 'Worried about making wrong technology choices',
        urgency: 80
      }
    ],
    desired_outcomes: [
      {
        outcome: 'Flexible, open AI architecture that integrates with existing systems',
        functional_benefit: 'Reduced technical debt and faster innovation cycles',
        timeline: '6-12 months'
      },
      {
        outcome: 'Vendor-agnostic AI platform with strong integration capabilities',
        functional_benefit: 'Freedom to choose best-of-breed solutions',
        timeline: '3-6 months'
      }
    ],
    brand_id: brandId
  },
  {
    persona_name: 'Contact Center Modernizers',
    role: {
      title: 'Director of Customer Operations',
      seniority_level: 'Management',
      department: 'Customer Service',
      decision_making_authority: 'Budget Recommender'
    },
    company_type: 'Large (500-999 employees)',
    industry: {
      primary_industry: 'Technology Services',
      sub_industry: 'Customer Operations'
    },
    pain_points: [
      {
        description: 'High agent turnover and training costs',
        emotional_impact: 'Stressed about maintaining service quality with limited resources',
        urgency: 90
      },
      {
        description: 'Customers frustrated with long wait times and repetitive questions',
        emotional_impact: 'Pressure to improve satisfaction scores',
        urgency: 85
      }
    ],
    desired_outcomes: [
      {
        outcome: 'Automated resolution of routine customer inquiries',
        functional_benefit: 'Reduced operational costs and faster resolution times',
        timeline: '3-6 months'
      },
      {
        outcome: 'Enhanced agent productivity through AI assistance',
        functional_benefit: 'Improved job satisfaction and reduced turnover',
        timeline: '6-9 months'
      }
    ],
    brand_id: brandId
  },
  {
    persona_name: 'AI/ML Product Builders',
    role: {
      title: 'Product Manager - AI/ML',
      seniority_level: 'Management',
      department: 'Product',
      decision_making_authority: 'Technical Influencer'
    },
    company_type: 'Mid-market (200-999 employees)',
    industry: {
      primary_industry: 'Technology Services',
      sub_industry: 'AI/ML Products'
    },
    pain_points: [
      {
        description: 'Difficulty creating conversational AI that feels natural and intelligent',
        emotional_impact: 'Concerned about product competitiveness in AI-first market',
        urgency: 85
      },
      {
        description: 'Complex development cycles for conversational AI features',
        emotional_impact: 'Pressure to deliver AI capabilities faster than competition',
        urgency: 80
      }
    ],
    desired_outcomes: [
      {
        outcome: 'Rapid prototyping and deployment of conversational AI features',
        functional_benefit: 'Faster time-to-market and competitive advantage',
        timeline: '1-3 months'
      },
      {
        outcome: 'Sophisticated conversation design tools for non-technical users',
        functional_benefit: 'Democratized AI development across product teams',
        timeline: '3-6 months'
      }
    ],
    brand_id: brandId
  }
];

// Convert to the format expected by the database
const formattedPersonas = buyerPersonas.map((persona, index) => ({
  ...persona,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}));

console.log('Generated buyer personas for OpenDialog:');
console.log(JSON.stringify(formattedPersonas, null, 2));

// This script can be used to populate the buyer_personas table
// or included in a migration to ensure personas exist for existing UVP data