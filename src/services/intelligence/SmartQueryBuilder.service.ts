/**
 * Smart Query Builder Service
 *
 * Industry-agnostic query templates that pull customer-focused insights
 * Works with existing APIs (Serper, Perplexity) - no new API dependencies
 *
 * Phase 4: Enhanced Data Collection
 */

export interface QueryTemplate {
  id: string;
  name: string;
  category: 'customer_questions' | 'competitor_analysis' | 'local_context' | 'decision_factors' | 'pain_points';
  apiType: 'serper' | 'perplexity';
  template: string;  // {industry}, {location}, {business_type} placeholders
  purpose: string;
}

export interface QueryContext {
  industry: string;
  location?: {
    city: string;
    state: string;
  };
  businessType?: string;
  competitors?: string[];
}

export interface GeneratedQuery {
  query: string;
  apiType: 'serper' | 'perplexity';
  category: string;
  purpose: string;
}

class SmartQueryBuilder {
  /**
   * Query templates optimized for customer insights
   */
  private readonly QUERY_TEMPLATES: QueryTemplate[] = [
    // Customer Questions (Serper - site:quora.com, site:reddit.com)
    {
      id: 'quora-customer-questions',
      name: 'Quora Customer Questions',
      category: 'customer_questions',
      apiType: 'serper',
      template: 'site:quora.com "why do people" {industry}',
      purpose: 'Find real customer questions about industry'
    },
    {
      id: 'reddit-customer-discussions',
      name: 'Reddit Customer Discussions',
      category: 'customer_questions',
      apiType: 'serper',
      template: 'site:reddit.com "{industry}" "anyone know" OR "does anyone"',
      purpose: 'Find organic customer discussions and questions'
    },
    {
      id: 'customer-complaints',
      name: 'Customer Complaints',
      category: 'pain_points',
      apiType: 'serper',
      template: '"{industry}" "worst part" OR "hate when" OR "frustrated by" {location}',
      purpose: 'Identify common customer frustrations'
    },
    {
      id: 'customer-comparison-behavior',
      name: 'Customer Comparison Behavior',
      category: 'decision_factors',
      apiType: 'serper',
      template: '"{industry}" "vs" OR "compared to" OR "better than" {location}',
      purpose: 'Understand how customers compare options'
    },

    // Competitor Analysis (Serper)
    {
      id: 'competitor-reviews',
      name: 'Competitor Reviews',
      category: 'competitor_analysis',
      apiType: 'serper',
      template: 'site:yelp.com OR site:google.com/maps {industry} {location} review',
      purpose: 'Analyze competitor strengths and weaknesses from reviews'
    },
    {
      id: 'competitor-mentions',
      name: 'Competitor Social Mentions',
      category: 'competitor_analysis',
      apiType: 'serper',
      template: 'site:twitter.com OR site:facebook.com {competitors} {location}',
      purpose: 'Find how competitors are discussed on social media'
    },

    // Local Context (Serper)
    {
      id: 'local-news-events',
      name: 'Local News & Events',
      category: 'local_context',
      apiType: 'serper',
      template: '{location} news events "{industry}" OR "local {business_type}"',
      purpose: 'Find local events and news relevant to business'
    },
    {
      id: 'local-trends',
      name: 'Local Trends',
      category: 'local_context',
      apiType: 'serper',
      template: '{location} "people are" OR "everyone is" "{industry}"',
      purpose: 'Identify local behavioral trends'
    },

    // Decision Factors (Perplexity)
    {
      id: 'customer-decision-factors',
      name: 'Customer Decision Factors',
      category: 'decision_factors',
      apiType: 'perplexity',
      template: 'What factors do customers consider when choosing a {industry} in {location}? What matters most to them?',
      purpose: 'Understand customer decision-making process'
    },
    {
      id: 'industry-trends-affecting-customers',
      name: 'Industry Trends Affecting Customers',
      category: 'decision_factors',
      apiType: 'perplexity',
      template: 'What current trends in the {industry} industry are affecting customer behavior and expectations in {location}?',
      purpose: 'Identify trends impacting customer expectations'
    },
    {
      id: 'common-customer-complaints',
      name: 'Common Customer Complaints',
      category: 'pain_points',
      apiType: 'perplexity',
      template: 'What are the most common complaints customers have about {industry} businesses in {location}? What frustrates them most?',
      purpose: 'Deep dive into customer pain points'
    },
    {
      id: 'customer-unmet-needs',
      name: 'Customer Unmet Needs',
      category: 'pain_points',
      apiType: 'perplexity',
      template: 'What unmet needs or gaps do customers experience with {industry} businesses? What do they wish was different?',
      purpose: 'Identify unarticulated customer needs'
    },
    {
      id: 'why-customers-switch',
      name: 'Why Customers Switch',
      category: 'decision_factors',
      apiType: 'perplexity',
      template: 'Why do customers switch from one {industry} to another? What makes them change their choice?',
      purpose: 'Understand customer retention and churn factors'
    },
    {
      id: 'seasonal-customer-behavior',
      name: 'Seasonal Customer Behavior',
      category: 'local_context',
      apiType: 'perplexity',
      template: 'How does customer behavior change seasonally for {industry} businesses in {location}? What patterns emerge throughout the year?',
      purpose: 'Identify seasonal opportunities'
    }
  ];

  /**
   * Generate queries from context
   */
  generateQueries(context: QueryContext): GeneratedQuery[] {
    const queries: GeneratedQuery[] = [];

    for (const template of this.QUERY_TEMPLATES) {
      const query = this.fillTemplate(template, context);

      if (query) {
        queries.push({
          query,
          apiType: template.apiType,
          category: template.category,
          purpose: template.purpose
        });
      }
    }

    return queries;
  }

  /**
   * Generate queries for specific category
   */
  generateQueriesByCategory(context: QueryContext, category: string): GeneratedQuery[] {
    const templates = this.QUERY_TEMPLATES.filter(t => t.category === category);
    const queries: GeneratedQuery[] = [];

    for (const template of templates) {
      const query = this.fillTemplate(template, context);

      if (query) {
        queries.push({
          query,
          apiType: template.apiType,
          category: template.category,
          purpose: template.purpose
        });
      }
    }

    return queries;
  }

  /**
   * Generate queries for specific API type
   */
  generateQueriesByAPI(context: QueryContext, apiType: 'serper' | 'perplexity'): GeneratedQuery[] {
    const templates = this.QUERY_TEMPLATES.filter(t => t.apiType === apiType);
    const queries: GeneratedQuery[] = [];

    for (const template of templates) {
      const query = this.fillTemplate(template, context);

      if (query) {
        queries.push({
          query,
          apiType: template.apiType,
          category: template.category,
          purpose: template.purpose
        });
      }
    }

    return queries;
  }

  /**
   * Fill template with context values
   */
  private fillTemplate(template: QueryTemplate, context: QueryContext): string | null {
    let query = template.template;

    // Replace {industry}
    if (query.includes('{industry}')) {
      if (!context.industry) return null;
      query = query.replace(/{industry}/g, context.industry);
    }

    // Replace {location}
    if (query.includes('{location}')) {
      if (!context.location) return null;
      const location = `${context.location.city}, ${context.location.state}`;
      query = query.replace(/{location}/g, location);
    }

    // Replace {business_type}
    if (query.includes('{business_type}')) {
      const businessType = context.businessType || this.inferBusinessType(context.industry);
      query = query.replace(/{business_type}/g, businessType);
    }

    // Replace {competitors}
    if (query.includes('{competitors}')) {
      if (!context.competitors || context.competitors.length === 0) return null;
      const competitorList = context.competitors.slice(0, 3).join(' OR ');
      query = query.replace(/{competitors}/g, competitorList);
    }

    return query;
  }

  /**
   * Infer business type from industry
   */
  private inferBusinessType(industry: string): string {
    const industryLower = industry.toLowerCase();

    if (industryLower.includes('restaurant') || industryLower.includes('food')) return 'restaurant';
    if (industryLower.includes('coffee') || industryLower.includes('cafe')) return 'coffee shop';
    if (industryLower.includes('dental') || industryLower.includes('dentist')) return 'dental practice';
    if (industryLower.includes('health') || industryLower.includes('medical')) return 'healthcare provider';
    if (industryLower.includes('retail') || industryLower.includes('shop')) return 'retail store';
    if (industryLower.includes('salon') || industryLower.includes('spa')) return 'salon';
    if (industryLower.includes('gym') || industryLower.includes('fitness')) return 'fitness center';
    if (industryLower.includes('law') || industryLower.includes('legal')) return 'law firm';
    if (industryLower.includes('real estate')) return 'real estate agency';
    if (industryLower.includes('plumb') || industryLower.includes('hvac') || industryLower.includes('electric')) return 'home service';

    return 'business';
  }

  /**
   * Get recommended query mix for balanced insights
   */
  getRecommendedQueryMix(context: QueryContext): {
    serperQueries: GeneratedQuery[];
    perplexityQueries: GeneratedQuery[];
    totalQueries: number;
  } {
    // Recommended mix: 60% Serper (faster, cheaper), 40% Perplexity (deeper insights)
    const serperQueries = this.generateQueriesByAPI(context, 'serper').slice(0, 6);
    const perplexityQueries = this.generateQueriesByAPI(context, 'perplexity').slice(0, 4);

    return {
      serperQueries,
      perplexityQueries,
      totalQueries: serperQueries.length + perplexityQueries.length
    };
  }

  /**
   * Get customer-focused queries only
   */
  getCustomerFocusedQueries(context: QueryContext): GeneratedQuery[] {
    const categories: Array<'customer_questions' | 'decision_factors' | 'pain_points'> = [
      'customer_questions',
      'decision_factors',
      'pain_points'
    ];

    const queries: GeneratedQuery[] = [];

    for (const category of categories) {
      queries.push(...this.generateQueriesByCategory(context, category));
    }

    return queries;
  }

  /**
   * Explain query purpose for logging/debugging
   */
  explainQuery(query: GeneratedQuery): string {
    return `[${query.apiType.toUpperCase()}] ${query.category}: ${query.purpose}\nQuery: "${query.query}"`;
  }
}

export const smartQueryBuilder = new SmartQueryBuilder();
