/**
 * Integration Gap Collector
 *
 * Detects workflow friction points and integration gaps for competitors.
 * Analyzes ecosystem compatibility, API limitations, and workflow disruptions.
 *
 * Created: 2025-11-29
 */

import { SerperAPI } from '../serper-api';
import type { IntegrationGapResult } from './types';

interface IntegrationIssue {
  category: 'api' | 'workflow' | 'compatibility' | 'migration';
  severity: 'high' | 'medium' | 'low';
  description: string;
  source: string;
}

interface WorkflowFriction {
  workflow: string;
  friction_point: string;
  user_impact: string;
  frequency: 'common' | 'occasional' | 'rare';
}

class IntegrationGapCollector {
  /**
   * Collect integration gap data for a competitor
   */
  async collect(
    competitorName: string,
    industry?: string
  ): Promise<IntegrationGapResult> {
    console.log(`[IntegrationGapCollector] Analyzing ${competitorName}`);

    try {
      // Run searches in parallel
      const [
        integrationResults,
        apiResults,
        migrationResults,
        workflowResults
      ] = await Promise.all([
        this.searchIntegrationIssues(competitorName),
        this.searchAPILimitations(competitorName),
        this.searchMigrationPains(competitorName),
        this.searchWorkflowFrictions(competitorName)
      ]);

      // Analyze and categorize issues
      const integrationIssues = this.categorizeIssues([
        ...integrationResults,
        ...apiResults,
        ...migrationResults
      ]);

      // Extract workflow frictions
      const workflowFrictions = this.extractWorkflowFrictions(workflowResults);

      // Identify missing integrations
      const missingIntegrations = await this.identifyMissingIntegrations(
        competitorName,
        industry
      );

      // Calculate integration health score
      const healthScore = this.calculateHealthScore(
        integrationIssues,
        workflowFrictions,
        missingIntegrations
      );

      return {
        success: true,
        source: 'integration-gap',
        timestamp: new Date().toISOString(),
        data: {
          integration_issues: integrationIssues,
          workflow_frictions: workflowFrictions,
          missing_integrations: missingIntegrations,
          health_score: healthScore,
          ecosystem_gaps: this.identifyEcosystemGaps(integrationIssues)
        }
      };
    } catch (error) {
      console.error('[IntegrationGapCollector] Error:', error);
      return {
        success: false,
        source: 'integration-gap',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        data: {
          integration_issues: [],
          workflow_frictions: [],
          missing_integrations: [],
          health_score: 50,
          ecosystem_gaps: []
        }
      };
    }
  }

  /**
   * Search for integration issues
   */
  private async searchIntegrationIssues(competitorName: string): Promise<Array<{
    title: string;
    snippet: string;
    category: string;
  }>> {
    try {
      const results = await SerperAPI.searchGoogle(
        `${competitorName} integration problems OR issues OR not working`
      );

      return results.slice(0, 10).map(r => ({
        title: r.title,
        snippet: r.snippet,
        category: this.detectIssueCategory(r.title + ' ' + r.snippet)
      }));
    } catch (error) {
      console.error('[IntegrationGapCollector] Integration search error:', error);
      return [];
    }
  }

  /**
   * Search for API limitations
   */
  private async searchAPILimitations(competitorName: string): Promise<Array<{
    title: string;
    snippet: string;
    category: string;
  }>> {
    try {
      const results = await SerperAPI.searchGoogle(
        `${competitorName} API limitations OR rate limit OR missing endpoint`
      );

      return results.slice(0, 8).map(r => ({
        title: r.title,
        snippet: r.snippet,
        category: 'api'
      }));
    } catch (error) {
      console.error('[IntegrationGapCollector] API search error:', error);
      return [];
    }
  }

  /**
   * Search for migration pain points
   */
  private async searchMigrationPains(competitorName: string): Promise<Array<{
    title: string;
    snippet: string;
    category: string;
  }>> {
    try {
      const results = await SerperAPI.searchGoogle(
        `migrate from ${competitorName} OR switch from ${competitorName} OR leave ${competitorName}`
      );

      return results.slice(0, 8).map(r => ({
        title: r.title,
        snippet: r.snippet,
        category: 'migration'
      }));
    } catch (error) {
      console.error('[IntegrationGapCollector] Migration search error:', error);
      return [];
    }
  }

  /**
   * Search for workflow friction points
   */
  private async searchWorkflowFrictions(competitorName: string): Promise<Array<{
    title: string;
    snippet: string;
  }>> {
    try {
      const results = await SerperAPI.searchGoogle(
        `${competitorName} workaround OR frustrating OR slow OR manual process`
      );

      return results.slice(0, 10).map(r => ({
        title: r.title,
        snippet: r.snippet
      }));
    } catch (error) {
      console.error('[IntegrationGapCollector] Workflow search error:', error);
      return [];
    }
  }

  /**
   * Detect issue category from text
   */
  private detectIssueCategory(text: string): string {
    const lower = text.toLowerCase();

    if (lower.includes('api') || lower.includes('endpoint') || lower.includes('rate limit')) {
      return 'api';
    }
    if (lower.includes('workflow') || lower.includes('process') || lower.includes('automat')) {
      return 'workflow';
    }
    if (lower.includes('compat') || lower.includes('sync') || lower.includes('connect')) {
      return 'compatibility';
    }
    if (lower.includes('migrat') || lower.includes('switch') || lower.includes('export')) {
      return 'migration';
    }

    return 'workflow';
  }

  /**
   * Categorize and deduplicate issues
   */
  private categorizeIssues(
    results: Array<{ title: string; snippet: string; category: string }>
  ): IntegrationIssue[] {
    const issues: IntegrationIssue[] = [];
    const seen = new Set<string>();

    for (const result of results) {
      // Create a key for deduplication
      const key = result.title.toLowerCase().substring(0, 50);
      if (seen.has(key)) continue;
      seen.add(key);

      // Determine severity based on language
      const severity = this.determineSeverity(result.snippet);

      issues.push({
        category: result.category as IntegrationIssue['category'],
        severity,
        description: result.snippet.substring(0, 200),
        source: result.title
      });
    }

    // Sort by severity
    const severityOrder = { high: 0, medium: 1, low: 2 };
    return issues
      .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
      .slice(0, 15);
  }

  /**
   * Determine severity from text
   */
  private determineSeverity(text: string): 'high' | 'medium' | 'low' {
    const lower = text.toLowerCase();

    const highIndicators = ['critical', 'broken', 'not working', 'major', 'severe', 'blocking'];
    const lowIndicators = ['minor', 'small', 'workaround', 'sometimes', 'occasionally'];

    if (highIndicators.some(i => lower.includes(i))) return 'high';
    if (lowIndicators.some(i => lower.includes(i))) return 'low';
    return 'medium';
  }

  /**
   * Extract workflow friction points
   */
  private extractWorkflowFrictions(
    results: Array<{ title: string; snippet: string }>
  ): WorkflowFriction[] {
    const frictions: WorkflowFriction[] = [];

    // Common workflow patterns to detect
    const workflowPatterns = [
      { pattern: /manual(ly)?/i, workflow: 'Manual processes' },
      { pattern: /export/i, workflow: 'Data export' },
      { pattern: /import/i, workflow: 'Data import' },
      { pattern: /sync/i, workflow: 'Data synchronization' },
      { pattern: /automat/i, workflow: 'Automation' },
      { pattern: /report/i, workflow: 'Reporting' },
      { pattern: /integrat/i, workflow: 'Third-party integrations' },
      { pattern: /collaborat/i, workflow: 'Team collaboration' }
    ];

    for (const result of results) {
      const text = `${result.title} ${result.snippet}`;

      for (const { pattern, workflow } of workflowPatterns) {
        if (pattern.test(text)) {
          // Extract the friction point
          const frictionMatch = text.match(
            /(?:have to|need to|must|can't|cannot|doesn't|don't|won't|unable to)[^.!?]{10,80}/i
          );

          if (frictionMatch) {
            frictions.push({
              workflow,
              friction_point: frictionMatch[0].trim(),
              user_impact: this.extractUserImpact(text),
              frequency: this.determineFrequency(text)
            });
            break;
          }
        }
      }
    }

    return frictions.slice(0, 10);
  }

  /**
   * Extract user impact from text
   */
  private extractUserImpact(text: string): string {
    const lower = text.toLowerCase();

    if (lower.includes('time') || lower.includes('hour') || lower.includes('slow')) {
      return 'Time wasted on manual work';
    }
    if (lower.includes('error') || lower.includes('mistake') || lower.includes('wrong')) {
      return 'Increased error risk';
    }
    if (lower.includes('cost') || lower.includes('expensive') || lower.includes('pay')) {
      return 'Additional costs';
    }
    if (lower.includes('frustrat') || lower.includes('annoy') || lower.includes('hate')) {
      return 'User frustration';
    }

    return 'Workflow disruption';
  }

  /**
   * Determine friction frequency
   */
  private determineFrequency(text: string): 'common' | 'occasional' | 'rare' {
    const lower = text.toLowerCase();

    if (lower.includes('always') || lower.includes('every') || lower.includes('constant')) {
      return 'common';
    }
    if (lower.includes('sometimes') || lower.includes('occasional') || lower.includes('rarely')) {
      return 'occasional';
    }

    return 'occasional';
  }

  /**
   * Identify missing integrations based on industry
   */
  private async identifyMissingIntegrations(
    competitorName: string,
    industry?: string
  ): Promise<string[]> {
    try {
      // Search for "X doesn't integrate with" or "X integration with Y"
      const results = await SerperAPI.searchGoogle(
        `${competitorName} doesn't integrate OR no integration OR missing integration`
      );

      const missing: string[] = [];

      // Common integration targets by category
      const commonIntegrations = [
        'Slack', 'Zapier', 'HubSpot', 'Salesforce', 'Google Workspace',
        'Microsoft 365', 'Notion', 'Airtable', 'Stripe', 'QuickBooks',
        'Shopify', 'WordPress', 'Mailchimp', 'Intercom', 'Zendesk'
      ];

      for (const result of results) {
        const text = `${result.title} ${result.snippet}`.toLowerCase();

        // Look for mentions of missing integrations
        for (const integration of commonIntegrations) {
          if (
            text.includes(integration.toLowerCase()) &&
            (text.includes("doesn't") || text.includes('no ') || text.includes('missing'))
          ) {
            if (!missing.includes(integration)) {
              missing.push(integration);
            }
          }
        }

        // Also extract from "wish it integrated with X" patterns
        const wishMatch = text.match(/wish(?:ed)?\s+(?:it\s+)?integrat(?:ed|es)?\s+with\s+(\w+)/i);
        if (wishMatch && !missing.includes(wishMatch[1])) {
          missing.push(wishMatch[1]);
        }
      }

      return missing.slice(0, 10);
    } catch (error) {
      console.error('[IntegrationGapCollector] Missing integrations error:', error);
      return [];
    }
  }

  /**
   * Calculate integration health score
   */
  private calculateHealthScore(
    issues: IntegrationIssue[],
    frictions: WorkflowFriction[],
    missingIntegrations: string[]
  ): number {
    let score = 100;

    // Deduct for issues by severity
    for (const issue of issues) {
      if (issue.severity === 'high') score -= 8;
      else if (issue.severity === 'medium') score -= 4;
      else score -= 2;
    }

    // Deduct for workflow frictions
    for (const friction of frictions) {
      if (friction.frequency === 'common') score -= 5;
      else if (friction.frequency === 'occasional') score -= 3;
      else score -= 1;
    }

    // Deduct for missing integrations
    score -= missingIntegrations.length * 2;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Identify ecosystem gaps
   */
  private identifyEcosystemGaps(issues: IntegrationIssue[]): string[] {
    const gaps: string[] = [];

    // Group by category
    const byCategory = issues.reduce((acc, issue) => {
      acc[issue.category] = (acc[issue.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Identify significant gaps
    if (byCategory.api >= 3) {
      gaps.push('API limitations affecting developer experience');
    }
    if (byCategory.workflow >= 3) {
      gaps.push('Workflow automation gaps');
    }
    if (byCategory.compatibility >= 2) {
      gaps.push('Ecosystem compatibility issues');
    }
    if (byCategory.migration >= 2) {
      gaps.push('Migration friction creating lock-in');
    }

    return gaps;
  }
}

export const integrationGapCollector = new IntegrationGapCollector();
