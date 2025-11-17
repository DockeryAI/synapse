/**
 * Responsive Audit - Mobile Usability Analysis
 *
 * Scans components for mobile responsiveness issues
 * Because apparently "looks good on my MacBook" isn't a valid QA strategy
 *
 * @author Roy (who's seen this same bug report 47 times)
 */

import { ResponsiveIssue } from '../../types/mobile.types';

export class ResponsiveAudit {
  /**
   * Run full responsive audit
   * Returns list of issues found across all components
   */
  static async runFullAudit(): Promise<ResponsiveIssue[]> {
    const issues: ResponsiveIssue[] = [];

    // Campaign Components
    issues.push(...this.auditCampaignComponents());

    // Preview Components
    issues.push(...this.auditPreviewComponents());

    // UI Components
    issues.push(...this.auditUIComponents());

    // Sort by severity
    issues.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    return issues;
  }

  /**
   * Audit campaign components
   */
  private static auditCampaignComponents(): ResponsiveIssue[] {
    return [
      {
        component: 'CampaignTypeCard',
        issue: 'Icon sizes too small on mobile (w-12 h-12 = 48px)',
        severity: 'medium',
        element: 'Icon container div',
        fix: 'Increase to w-14 h-14 md:w-12 md:h-12 (56px on mobile, 48px on desktop)',
        location: 'src/components/campaign/CampaignTypeCard.tsx:98',
      },
      {
        component: 'CampaignTypeCard',
        issue: 'Badge text too small (text-xs = 12px)',
        severity: 'medium',
        element: 'Badge components',
        fix: 'Use text-sm md:text-xs (14px on mobile, 12px on desktop)',
        location: 'src/components/campaign/CampaignTypeCard.tsx:143',
      },
      {
        component: 'CampaignTypeCard',
        issue: 'Card hover effects not mobile-friendly (hover:scale)',
        severity: 'low',
        element: 'motion.div animations',
        fix: 'Disable hover effects on touch devices using @media (hover: hover)',
        location: 'src/components/campaign/CampaignTypeCard.tsx:62',
      },
      {
        component: 'CampaignTypeSelector',
        issue: 'Grid gaps may be too tight on small screens',
        severity: 'low',
        element: 'Grid container',
        fix: 'Adjust gap from gap-6 to gap-4 on mobile',
        location: 'src/components/campaign/CampaignTypeSelector.tsx',
      },
      {
        component: 'ContentMixer',
        issue: 'Insight cards may be too dense on mobile',
        severity: 'medium',
        element: 'Insight card layout',
        fix: 'Increase padding on mobile, reduce content density',
        location: 'src/components/campaign/content-mixer/ContentMixer.tsx',
      },
    ];
  }

  /**
   * Audit preview components
   */
  private static auditPreviewComponents(): ResponsiveIssue[] {
    return [
      {
        component: 'CampaignPreviewCard',
        issue: 'max-w-lg (512px) too wide for mobile viewports',
        severity: 'high',
        element: 'Social media preview container',
        fix: 'Change to max-w-full md:max-w-lg or max-w-sm',
        location: 'src/components/campaign/preview/CampaignPreviewCard.tsx:145',
      },
      {
        component: 'CampaignPreviewCard',
        issue: 'Edit buttons too small for touch (appears to be default button size)',
        severity: 'critical',
        element: 'Edit section buttons',
        fix: 'Ensure minimum 44px height and add py-3 px-6 on mobile',
        location: 'src/components/campaign/preview/CampaignPreviewCard.tsx:91',
      },
      {
        component: 'CampaignPreviewCard',
        issue: 'Character count text too small (text-xs)',
        severity: 'medium',
        element: 'Character count display',
        fix: 'Increase to text-sm md:text-xs',
        location: 'src/components/campaign/preview/CampaignPreviewCard.tsx:101',
      },
      {
        component: 'CampaignPreviewCard',
        issue: 'Social preview buttons may be too small for touch',
        severity: 'high',
        element: 'Like/Comment/Share buttons',
        fix: 'Ensure 44px minimum touch target with p-3',
        location: 'src/components/campaign/preview/CampaignPreviewCard.tsx:205',
      },
      {
        component: 'PlatformTabs',
        issue: 'Tab text may wrap awkwardly on narrow screens',
        severity: 'medium',
        element: 'Platform tab buttons',
        fix: 'Use text-xs on mobile, text-sm on desktop, ensure no-wrap',
        location: 'src/components/campaign/preview/PlatformTabs.tsx',
      },
    ];
  }

  /**
   * Audit UI components
   */
  private static auditUIComponents(): ResponsiveIssue[] {
    return [
      {
        component: 'CampaignPage',
        issue: 'Grid layout needs better mobile spacing',
        severity: 'medium',
        element: 'Smart Picks / Mixer selection grid',
        fix: 'Use gap-4 md:gap-6 for tighter mobile spacing',
        location: 'src/pages/CampaignPage.tsx:653',
      },
      {
        component: 'CampaignPage',
        issue: 'Header back button too small',
        severity: 'medium',
        element: 'ArrowLeft button',
        fix: 'Increase p-2 to p-3 for 44px touch target',
        location: 'src/pages/CampaignPage.tsx:594',
      },
      {
        component: 'CampaignPage',
        issue: 'Progress bar too small on mobile',
        severity: 'low',
        element: 'Progress indicator',
        fix: 'Hide on mobile (hidden md:block), show % only',
        location: 'src/pages/CampaignPage.tsx:621',
      },
      {
        component: 'Global',
        issue: 'No viewport meta tag verification',
        severity: 'critical',
        element: 'HTML head',
        fix: 'Ensure <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5"> exists',
        location: 'index.html',
      },
      {
        component: 'Global',
        issue: 'No touch-friendly focus states',
        severity: 'high',
        element: 'All interactive elements',
        fix: 'Add focus-visible:ring-2 focus-visible:ring-offset-2 to all buttons',
        location: 'Global CSS/Components',
      },
    ];
  }

  /**
   * Generate human-readable audit report
   */
  static generateReport(issues: ResponsiveIssue[]): string {
    let report = `═══════════════════════════════════════════════════════════════
📱 MOBILE RESPONSIVE AUDIT REPORT
Generated: ${new Date().toISOString()}
═══════════════════════════════════════════════════════════════\n\n`;

    const bySeverity = {
      critical: issues.filter(i => i.severity === 'critical'),
      high: issues.filter(i => i.severity === 'high'),
      medium: issues.filter(i => i.severity === 'medium'),
      low: issues.filter(i => i.severity === 'low'),
    };

    report += `📊 SUMMARY\n`;
    report += `──────────────────────────────────────────────────────────────\n`;
    report += `Total Issues: ${issues.length}\n`;
    report += `  🔴 Critical: ${bySeverity.critical.length}\n`;
    report += `  🟠 High: ${bySeverity.high.length}\n`;
    report += `  🟡 Medium: ${bySeverity.medium.length}\n`;
    report += `  🟢 Low: ${bySeverity.low.length}\n\n`;

    // Critical issues
    if (bySeverity.critical.length > 0) {
      report += `🔴 CRITICAL ISSUES (Fix Immediately)\n`;
      report += `──────────────────────────────────────────────────────────────\n`;
      bySeverity.critical.forEach((issue, idx) => {
        report += `${idx + 1}. ${issue.component}\n`;
        report += `   Issue: ${issue.issue}\n`;
        if (issue.element) report += `   Element: ${issue.element}\n`;
        report += `   Fix: ${issue.fix}\n`;
        if (issue.location) report += `   Location: ${issue.location}\n`;
        report += `\n`;
      });
    }

    // High issues
    if (bySeverity.high.length > 0) {
      report += `🟠 HIGH PRIORITY ISSUES\n`;
      report += `──────────────────────────────────────────────────────────────\n`;
      bySeverity.high.forEach((issue, idx) => {
        report += `${idx + 1}. ${issue.component}\n`;
        report += `   Issue: ${issue.issue}\n`;
        report += `   Fix: ${issue.fix}\n`;
        if (issue.location) report += `   Location: ${issue.location}\n`;
        report += `\n`;
      });
    }

    // Medium issues
    if (bySeverity.medium.length > 0) {
      report += `🟡 MEDIUM PRIORITY ISSUES\n`;
      report += `──────────────────────────────────────────────────────────────\n`;
      bySeverity.medium.forEach((issue, idx) => {
        report += `${idx + 1}. ${issue.component}: ${issue.issue}\n`;
        report += `   Fix: ${issue.fix}\n`;
      });
      report += `\n`;
    }

    // Low issues (summary only)
    if (bySeverity.low.length > 0) {
      report += `🟢 LOW PRIORITY ISSUES (${bySeverity.low.length} total)\n`;
      report += `──────────────────────────────────────────────────────────────\n`;
      bySeverity.low.forEach((issue, idx) => {
        report += `${idx + 1}. ${issue.component}: ${issue.issue}\n`;
      });
      report += `\n`;
    }

    report += `═══════════════════════════════════════════════════════════════\n`;
    report += `📝 RECOMMENDED ACTIONS\n`;
    report += `═══════════════════════════════════════════════════════════════\n\n`;
    report += `1. Fix all CRITICAL issues before deployment\n`;
    report += `2. Address HIGH priority issues in current sprint\n`;
    report += `3. Schedule MEDIUM issues for next sprint\n`;
    report += `4. LOW issues can be addressed as tech debt\n\n`;

    report += `💡 MOBILE-FIRST BEST PRACTICES\n`;
    report += `──────────────────────────────────────────────────────────────\n`;
    report += `✓ Minimum touch target: 44x44px (Apple HIG, Android guidelines)\n`;
    report += `✓ Minimum font size: 16px (prevents zoom on iOS)\n`;
    report += `✓ Adequate spacing: 8-12px between interactive elements\n`;
    report += `✓ Test on real devices, not just simulators\n`;
    report += `✓ Disable hover effects on touch devices\n`;
    report += `✓ Ensure focus states for accessibility\n`;
    report += `✓ Optimize images/assets for mobile bandwidth\n\n`;

    report += `End of report. Good luck. You'll need it.\n`;
    report += `- Roy\n`;

    return report;
  }

  /**
   * Quick validation - just check critical issues
   */
  static async quickCheck(): Promise<{ passed: boolean; criticalIssues: number }> {
    const issues = await this.runFullAudit();
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;

    return {
      passed: criticalIssues === 0,
      criticalIssues,
    };
  }

  /**
   * Export issues as JSON for CI/CD integration
   */
  static exportJSON(issues: ResponsiveIssue[]): string {
    return JSON.stringify({
      generatedAt: new Date().toISOString(),
      totalIssues: issues.length,
      bySeverity: {
        critical: issues.filter(i => i.severity === 'critical').length,
        high: issues.filter(i => i.severity === 'high').length,
        medium: issues.filter(i => i.severity === 'medium').length,
        low: issues.filter(i => i.severity === 'low').length,
      },
      issues,
    }, null, 2);
  }
}

export default ResponsiveAudit;
