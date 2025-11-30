/**
 * Talent Signal Collector
 *
 * Analyzes hiring patterns to detect strategic signals about competitors.
 * Job postings reveal product direction, expansion plans, and technology choices.
 *
 * Created: 2025-11-29
 */

import { SerperAPI } from '../serper-api';
import type { TalentSignalResult } from './types';

interface JobPosting {
  title: string;
  department: string;
  skills: string[];
  seniority: 'entry' | 'mid' | 'senior' | 'executive';
  signal: string;
}

interface HiringTrend {
  department: string;
  intensity: 'aggressive' | 'moderate' | 'minimal';
  focus_areas: string[];
  strategic_implication: string;
}

interface TechnologySignal {
  technology: string;
  adoption_stage: 'exploring' | 'adopting' | 'scaling';
  evidence: string;
}

class TalentSignalCollector {
  // Technology keywords to detect
  private readonly techKeywords = [
    'AI', 'ML', 'machine learning', 'artificial intelligence', 'GPT', 'LLM',
    'React', 'Vue', 'Angular', 'TypeScript', 'Node.js', 'Python', 'Go', 'Rust',
    'AWS', 'GCP', 'Azure', 'Kubernetes', 'Docker', 'Terraform',
    'PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch',
    'GraphQL', 'REST', 'gRPC', 'microservices'
  ];

  // Department mappings
  private readonly departmentKeywords: Record<string, string[]> = {
    'Engineering': ['engineer', 'developer', 'architect', 'devops', 'sre', 'platform'],
    'Product': ['product manager', 'product owner', 'ux', 'ui', 'designer'],
    'Sales': ['sales', 'account executive', 'sdr', 'bdr', 'revenue'],
    'Marketing': ['marketing', 'growth', 'brand', 'content', 'seo', 'demand gen'],
    'Data': ['data scientist', 'data engineer', 'analytics', 'bi', 'ml engineer'],
    'Customer Success': ['customer success', 'support', 'implementation', 'onboarding'],
    'Finance': ['finance', 'accounting', 'fp&a', 'controller'],
    'Legal': ['legal', 'compliance', 'privacy', 'counsel'],
    'HR': ['hr', 'recruiting', 'people ops', 'talent']
  };

  /**
   * Collect talent signals for a competitor
   */
  async collect(competitorName: string): Promise<TalentSignalResult> {
    console.log(`[TalentSignalCollector] Analyzing ${competitorName}`);

    try {
      // Search for job postings
      const [
        generalJobs,
        engineeringJobs,
        leadershipJobs
      ] = await Promise.all([
        this.searchJobs(competitorName),
        this.searchJobs(`${competitorName} engineer OR developer`),
        this.searchJobs(`${competitorName} director OR VP OR head of`)
      ]);

      // Combine and deduplicate
      const allJobs = this.deduplicateJobs([
        ...generalJobs,
        ...engineeringJobs,
        ...leadershipJobs
      ]);

      // Parse job postings
      const jobPostings = this.parseJobPostings(allJobs);

      // Analyze hiring trends
      const hiringTrends = this.analyzeHiringTrends(jobPostings);

      // Extract technology signals
      const technologySignals = this.extractTechnologySignals(allJobs);

      // Detect expansion signals
      const expansionSignals = await this.detectExpansionSignals(competitorName);

      // Calculate hiring velocity
      const hiringVelocity = this.calculateHiringVelocity(jobPostings);

      return {
        success: true,
        source: 'talent-signal',
        timestamp: new Date().toISOString(),
        data: {
          job_postings: jobPostings,
          hiring_trends: hiringTrends,
          technology_signals: technologySignals,
          expansion_signals: expansionSignals,
          hiring_velocity: hiringVelocity,
          strategic_insights: this.generateStrategicInsights(
            hiringTrends,
            technologySignals,
            expansionSignals
          )
        }
      };
    } catch (error) {
      console.error('[TalentSignalCollector] Error:', error);
      return {
        success: false,
        source: 'talent-signal',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        data: {
          job_postings: [],
          hiring_trends: [],
          technology_signals: [],
          expansion_signals: [],
          hiring_velocity: 'unknown',
          strategic_insights: []
        }
      };
    }
  }

  /**
   * Search for job postings
   */
  private async searchJobs(query: string): Promise<Array<{
    title: string;
    snippet: string;
    link: string;
  }>> {
    try {
      const results = await SerperAPI.searchGoogle(
        `${query} jobs OR careers site:linkedin.com OR site:greenhouse.io OR site:lever.co`
      );

      return results.slice(0, 15).map(r => ({
        title: r.title,
        snippet: r.snippet,
        link: r.link
      }));
    } catch (error) {
      console.error('[TalentSignalCollector] Job search error:', error);
      return [];
    }
  }

  /**
   * Deduplicate job results
   */
  private deduplicateJobs(
    jobs: Array<{ title: string; snippet: string; link: string }>
  ): Array<{ title: string; snippet: string; link: string }> {
    const seen = new Set<string>();
    return jobs.filter(job => {
      const key = job.title.toLowerCase().substring(0, 40);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Parse job postings into structured data
   */
  private parseJobPostings(
    jobs: Array<{ title: string; snippet: string; link: string }>
  ): JobPosting[] {
    const postings: JobPosting[] = [];

    for (const job of jobs) {
      const text = `${job.title} ${job.snippet}`.toLowerCase();

      // Detect department
      let department = 'Other';
      for (const [dept, keywords] of Object.entries(this.departmentKeywords)) {
        if (keywords.some(k => text.includes(k))) {
          department = dept;
          break;
        }
      }

      // Detect seniority
      let seniority: JobPosting['seniority'] = 'mid';
      if (text.includes('senior') || text.includes('sr.') || text.includes('lead')) {
        seniority = 'senior';
      } else if (text.includes('director') || text.includes('vp') || text.includes('head of') || text.includes('chief')) {
        seniority = 'executive';
      } else if (text.includes('junior') || text.includes('jr.') || text.includes('intern') || text.includes('entry')) {
        seniority = 'entry';
      }

      // Extract skills/technologies
      const skills = this.techKeywords.filter(tech =>
        text.includes(tech.toLowerCase())
      );

      // Generate strategic signal
      const signal = this.generateSignalFromJob(department, seniority, skills);

      postings.push({
        title: job.title,
        department,
        skills,
        seniority,
        signal
      });
    }

    return postings;
  }

  /**
   * Generate strategic signal from job characteristics
   */
  private generateSignalFromJob(
    department: string,
    seniority: JobPosting['seniority'],
    skills: string[]
  ): string {
    if (department === 'Engineering') {
      if (skills.some(s => ['AI', 'ML', 'GPT', 'LLM'].includes(s))) {
        return 'Investing in AI/ML capabilities';
      }
      if (seniority === 'executive') {
        return 'Building engineering leadership - scaling phase';
      }
      return 'Growing engineering team';
    }

    if (department === 'Sales' && seniority === 'executive') {
      return 'Scaling go-to-market operations';
    }

    if (department === 'Product' && seniority === 'senior') {
      return 'Expanding product capabilities';
    }

    if (department === 'Data') {
      return 'Investing in data infrastructure';
    }

    if (department === 'Customer Success') {
      return 'Focusing on retention and expansion';
    }

    return `Hiring for ${department}`;
  }

  /**
   * Analyze hiring trends by department
   */
  private analyzeHiringTrends(postings: JobPosting[]): HiringTrend[] {
    const trends: HiringTrend[] = [];

    // Group by department
    const byDepartment = postings.reduce((acc, posting) => {
      acc[posting.department] = acc[posting.department] || [];
      acc[posting.department].push(posting);
      return acc;
    }, {} as Record<string, JobPosting[]>);

    for (const [department, deptPostings] of Object.entries(byDepartment)) {
      // Determine intensity
      let intensity: HiringTrend['intensity'] = 'minimal';
      if (deptPostings.length >= 5) intensity = 'aggressive';
      else if (deptPostings.length >= 2) intensity = 'moderate';

      // Extract focus areas
      const allSkills = deptPostings.flatMap(p => p.skills);
      const skillCounts = allSkills.reduce((acc, skill) => {
        acc[skill] = (acc[skill] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const focusAreas = Object.entries(skillCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([skill]) => skill);

      // Generate strategic implication
      const strategic = this.generateStrategicImplication(department, intensity, focusAreas);

      trends.push({
        department,
        intensity,
        focus_areas: focusAreas.length > 0 ? focusAreas : ['General growth'],
        strategic_implication: strategic
      });
    }

    // Sort by intensity
    const intensityOrder = { aggressive: 0, moderate: 1, minimal: 2 };
    return trends.sort((a, b) => intensityOrder[a.intensity] - intensityOrder[b.intensity]);
  }

  /**
   * Generate strategic implication from hiring trend
   */
  private generateStrategicImplication(
    department: string,
    intensity: HiringTrend['intensity'],
    focusAreas: string[]
  ): string {
    if (intensity === 'aggressive') {
      if (department === 'Engineering') {
        if (focusAreas.some(f => ['AI', 'ML', 'GPT', 'LLM'].includes(f))) {
          return 'Major AI/ML product initiative likely underway';
        }
        return 'Significant product development acceleration';
      }
      if (department === 'Sales') {
        return 'Aggressive market expansion planned';
      }
      if (department === 'Marketing') {
        return 'Major brand or demand gen push incoming';
      }
    }

    if (department === 'Data' && intensity !== 'minimal') {
      return 'Building analytics/data capabilities - likely for AI or personalization';
    }

    if (department === 'Customer Success' && intensity !== 'minimal') {
      return 'Focusing on customer retention - may indicate churn concerns';
    }

    return `${intensity === 'moderate' ? 'Growing' : 'Maintaining'} ${department.toLowerCase()} capabilities`;
  }

  /**
   * Extract technology signals from job postings
   */
  private extractTechnologySignals(
    jobs: Array<{ title: string; snippet: string }>
  ): TechnologySignal[] {
    const techCounts: Record<string, number> = {};

    for (const job of jobs) {
      const text = `${job.title} ${job.snippet}`.toLowerCase();

      for (const tech of this.techKeywords) {
        if (text.includes(tech.toLowerCase())) {
          techCounts[tech] = (techCounts[tech] || 0) + 1;
        }
      }
    }

    // Convert to signals
    return Object.entries(techCounts)
      .filter(([_, count]) => count >= 2) // At least 2 mentions
      .map(([tech, count]) => {
        let adoptionStage: TechnologySignal['adoption_stage'] = 'exploring';
        if (count >= 5) adoptionStage = 'scaling';
        else if (count >= 3) adoptionStage = 'adopting';

        return {
          technology: tech,
          adoption_stage: adoptionStage,
          evidence: `Found in ${count} job posting${count > 1 ? 's' : ''}`
        };
      })
      .sort((a, b) => {
        const stageOrder = { scaling: 0, adopting: 1, exploring: 2 };
        return stageOrder[a.adoption_stage] - stageOrder[b.adoption_stage];
      })
      .slice(0, 10);
  }

  /**
   * Detect geographic/market expansion signals
   */
  private async detectExpansionSignals(competitorName: string): Promise<string[]> {
    try {
      const results = await SerperAPI.searchGoogle(
        `${competitorName} opens office OR expands to OR launches in`
      );

      const signals: string[] = [];

      // Location patterns
      const locationPatterns = [
        /opens?\s+(?:new\s+)?office\s+in\s+(\w+(?:\s+\w+)?)/i,
        /expands?\s+to\s+(\w+(?:\s+\w+)?)/i,
        /launches?\s+in\s+(\w+(?:\s+\w+)?)/i,
        /enters?\s+(\w+(?:\s+\w+)?)\s+market/i
      ];

      for (const result of results.slice(0, 10)) {
        const text = `${result.title} ${result.snippet}`;

        for (const pattern of locationPatterns) {
          const match = text.match(pattern);
          if (match && match[1]) {
            const location = match[1].trim();
            if (!signals.includes(`Expanding to ${location}`)) {
              signals.push(`Expanding to ${location}`);
            }
          }
        }
      }

      return signals.slice(0, 5);
    } catch (error) {
      console.error('[TalentSignalCollector] Expansion detection error:', error);
      return [];
    }
  }

  /**
   * Calculate overall hiring velocity
   */
  private calculateHiringVelocity(
    postings: JobPosting[]
  ): 'aggressive' | 'moderate' | 'minimal' | 'unknown' {
    if (postings.length === 0) return 'unknown';
    if (postings.length >= 15) return 'aggressive';
    if (postings.length >= 5) return 'moderate';
    return 'minimal';
  }

  /**
   * Generate strategic insights from all signals
   */
  private generateStrategicInsights(
    trends: HiringTrend[],
    techSignals: TechnologySignal[],
    expansionSignals: string[]
  ): string[] {
    const insights: string[] = [];

    // Check for AI investment
    const aiTech = techSignals.filter(t =>
      ['AI', 'ML', 'GPT', 'LLM', 'machine learning'].includes(t.technology)
    );
    if (aiTech.length > 0 && aiTech.some(t => t.adoption_stage !== 'exploring')) {
      insights.push('Actively investing in AI capabilities - potential product differentiator');
    }

    // Check for aggressive engineering growth
    const engTrend = trends.find(t => t.department === 'Engineering');
    if (engTrend?.intensity === 'aggressive') {
      insights.push('Rapid engineering growth suggests major product initiatives');
    }

    // Check for sales expansion
    const salesTrend = trends.find(t => t.department === 'Sales');
    if (salesTrend?.intensity === 'aggressive') {
      insights.push('Sales team expansion indicates go-to-market acceleration');
    }

    // Check for geographic expansion
    if (expansionSignals.length >= 2) {
      insights.push('Geographic expansion underway - entering new markets');
    }

    // Check for customer success focus
    const csTrend = trends.find(t => t.department === 'Customer Success');
    if (csTrend?.intensity !== 'minimal') {
      insights.push('Customer success investment may indicate retention focus');
    }

    // Default insight if nothing specific
    if (insights.length === 0) {
      const topTrend = trends[0];
      if (topTrend) {
        insights.push(`Primary focus: ${topTrend.department} (${topTrend.intensity} hiring)`);
      }
    }

    return insights;
  }
}

export const talentSignalCollector = new TalentSignalCollector();
