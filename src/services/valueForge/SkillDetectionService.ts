/**
 * Skill Detection Service
 *
 * Detects business capabilities/skills from website content and matches against
 * industry-specific skill taxonomy
 */

import type { Skill } from '@/types/valueForge';
import type { ValueForgeContext } from '@/types/valueForge';

export class SkillDetectionService {
  /**
   * Detect skills from website content and industry profile
   */
  detectSkills(context: ValueForgeContext): Skill[] {
    const skills: Skill[] = [];

    // Extract from website analysis
    const websiteSkills = this.extractFromWebsiteContent(context);
    skills.push(...websiteSkills);

    // Extract from industry profile
    const industrySkills = this.getIndustryStandardSkills(context);
    skills.push(...industrySkills);

    // Deduplicate and score
    return this.deduplicateAndScore(skills);
  }

  /**
   * Extract skills from website content
   */
  private extractFromWebsiteContent(context: ValueForgeContext): Skill[] {
    const skills: Skill[] = [];
    const websiteAnalysis = context.businessIntel?.website_analysis;

    if (!websiteAnalysis) return skills;

    // From value propositions
    if (websiteAnalysis.valuePropositions) {
      websiteAnalysis.valuePropositions.forEach((vp: string) => {
        const detected = this.parseSkillsFromText(vp);
        detected.forEach(skill => {
          skills.push({
            name: skill,
            description: `Detected from: "${vp}"`,
            confidence: 85,
            source: 'detected',
            isCore: false
          });
        });
      });
    }

    // From differentiators
    if (websiteAnalysis.differentiators) {
      websiteAnalysis.differentiators.forEach((diff: string) => {
        const detected = this.parseSkillsFromText(diff);
        detected.forEach(skill => {
          skills.push({
            name: skill,
            description: `Key differentiator`,
            confidence: 90,
            source: 'detected',
            isCore: true
          });
        });
      });
    }

    return skills;
  }

  /**
   * Parse skill keywords from text
   */
  private parseSkillsFromText(text: string): string[] {
    const skillKeywords = [
      // Service skills
      'consulting', 'design', 'development', 'strategy', 'planning',
      'implementation', 'training', 'coaching', 'mentoring', 'support',

      // Accounting/Tax (CPA)
      'tax preparation', 'tax planning', 'audit', 'assurance', 'bookkeeping',
      'financial statements', 'accounting', 'payroll', 'compliance', 'advisory',
      'tax return', 'IRS', 'financial reporting', 'CPA', 'certified',

      // Restaurant/Dining
      'catering', 'event planning', 'wine pairing', 'seasonal menus',
      'private dining', 'farm-to-table', 'custom menus', 'recipe development',

      // Technical
      'SEO', 'content creation', 'social media', 'branding', 'marketing',
      'analytics', 'automation', 'integration',

      // Professional
      'project management', 'consulting', 'research', 'analysis',
      'reporting', 'presentation'
    ];

    const detected: string[] = [];
    const lowerText = text.toLowerCase();

    skillKeywords.forEach(keyword => {
      if (lowerText.includes(keyword.toLowerCase())) {
        detected.push(this.capitalizeSkill(keyword));
      }
    });

    return detected;
  }

  /**
   * Get industry-standard skills
   */
  private getIndustryStandardSkills(context: ValueForgeContext): Skill[] {
    console.log('[SkillDetection] Context received:', {
      hasIndustryProfile: !!context.industryProfile,
      industryCode: context.industryCode,
      industryName: context.industryName,
      profileKeys: context.industryProfile ? Object.keys(context.industryProfile) : []
    });

    const industryProfile = context.industryProfile;
    if (!industryProfile) {
      console.warn('[SkillDetection] No industry profile in context');
      return [];
    }

    const industryCode = context.industryCode;

    // Try to extract skills dynamically from industry profile
    const dynamicSkills = this.extractSkillsFromIndustryProfile(industryProfile, industryCode);

    if (dynamicSkills.length > 0) {
      console.log(`[SkillDetection] Extracted ${dynamicSkills.length} skills from industry profile for ${industryCode}`);
      return dynamicSkills;
    }

    // Fallback: No skills could be extracted
    console.warn(`[SkillDetection] No skills found for industry ${industryCode} (${industryProfile.industryName}).`);
    return [];
  }

  /**
   * Extract skills from industry profile data
   */
  private extractSkillsFromIndustryProfile(industryProfile: any, industryCode: string): Skill[] {
    const skills: Skill[] = [];

    // Extract from competitive_advantages
    if (industryProfile.competitive_advantages && Array.isArray(industryProfile.competitive_advantages)) {
      industryProfile.competitive_advantages.slice(0, 5).forEach((advantage: any) => {
        const skillName = typeof advantage === 'string'
          ? advantage
          : advantage.advantage || advantage.name;

        if (skillName) {
          skills.push({
            name: this.capitalizeSkill(skillName),
            description: `Industry competitive advantage`,
            confidence: 85,
            source: 'industry',
            marketDemand: 75,
            isCore: false
          });
        }
      });
    }

    // Extract from value_propositions
    if (industryProfile.value_propositions && Array.isArray(industryProfile.value_propositions)) {
      industryProfile.value_propositions.slice(0, 3).forEach((vp: any) => {
        const vpText = typeof vp === 'string' ? vp : vp.proposition || vp.value;

        if (vpText) {
          // Extract key service phrases from value props
          const serviceSkills = this.extractServiceSkills(vpText);
          serviceSkills.forEach(skill => {
            skills.push({
              name: skill,
              description: `Core value proposition capability`,
              confidence: 80,
              source: 'industry',
              marketDemand: 70,
              isCore: true
            });
          });
        }
      });
    }

    // Extract from service_packages
    if (industryProfile.service_packages && Array.isArray(industryProfile.service_packages)) {
      industryProfile.service_packages.slice(0, 5).forEach((pkg: any) => {
        const serviceName = typeof pkg === 'string'
          ? pkg
          : pkg.name || pkg.service || pkg.package_name;

        if (serviceName) {
          skills.push({
            name: this.capitalizeSkill(serviceName),
            description: `Standard industry service offering`,
            confidence: 75,
            source: 'industry',
            marketDemand: 65,
            isCore: false
          });
        }
      });
    }

    // Deduplicate skills
    const uniqueSkills = new Map<string, Skill>();
    skills.forEach(skill => {
      const key = skill.name.toLowerCase();
      if (!uniqueSkills.has(key)) {
        uniqueSkills.set(key, skill);
      }
    });

    return Array.from(uniqueSkills.values()).slice(0, 10); // Return top 10
  }

  /**
   * Extract service skills from text
   */
  private extractServiceSkills(text: string): string[] {
    const skills: string[] = [];
    const lowerText = text.toLowerCase();

    // Common service patterns
    const servicePatterns = [
      /(\w+(?:\s+\w+){0,3})\s+services?/gi,
      /(\w+(?:\s+\w+){0,3})\s+solutions?/gi,
      /(\w+(?:\s+\w+){0,3})\s+consulting/gi,
      /(\w+(?:\s+\w+){0,3})\s+management/gi,
      /(\w+(?:\s+\w+){0,3})\s+support/gi,
      /(\w+(?:\s+\w+){0,3})\s+planning/gi,
      /(\w+(?:\s+\w+){0,3})\s+analysis/gi,
      /(\w+(?:\s+\w+){0,3})\s+implementation/gi
    ];

    servicePatterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          const skill = this.capitalizeSkill(match[1].trim() + ' ' + match[0].split(' ').pop());
          if (skill.length > 5 && skill.length < 60) {
            skills.push(skill);
          }
        }
      }
    });

    return skills.slice(0, 3); // Return top 3
  }

  /**
   * Calculate market demand for a skill
   */
  private calculateMarketDemand(skill: string, industryProfile: any): number {
    // Check if skill appears in industry power words or customer triggers
    const powerWords = industryProfile.powerWords || [];
    const triggers = industryProfile.customerTriggers || [];

    let demand = 50; // Base demand

    // Boost if in power words
    if (powerWords.some((pw: string) =>
      skill.toLowerCase().includes(pw.toLowerCase()) ||
      pw.toLowerCase().includes(skill.toLowerCase())
    )) {
      demand += 20;
    }

    // Boost if in customer triggers
    if (triggers.some((t: any) => {
      const trigger = typeof t === 'string' ? t : t.trigger;
      return skill.toLowerCase().includes(trigger.toLowerCase()) ||
             trigger.toLowerCase().includes(skill.toLowerCase());
    })) {
      demand += 25;
    }

    return Math.min(demand, 100);
  }

  /**
   * Deduplicate and score skills
   */
  private deduplicateAndScore(skills: Skill[]): Skill[] {
    const skillMap = new Map<string, Skill>();

    skills.forEach(skill => {
      const key = skill.name.toLowerCase();

      if (skillMap.has(key)) {
        // Merge: keep highest confidence, combine sources
        const existing = skillMap.get(key)!;
        existing.confidence = Math.max(existing.confidence, skill.confidence);

        if (skill.source === 'detected') {
          existing.source = 'detected'; // Detected trumps industry
        }

        existing.isCore = existing.isCore || skill.isCore;

        if (skill.marketDemand) {
          existing.marketDemand = Math.max(
            existing.marketDemand || 0,
            skill.marketDemand
          );
        }
      } else {
        skillMap.set(key, skill);
      }
    });

    // Sort by confidence + market demand
    return Array.from(skillMap.values()).sort((a, b) => {
      const scoreA = a.confidence + (a.marketDemand || 0);
      const scoreB = b.confidence + (b.marketDemand || 0);
      return scoreB - scoreA;
    });
  }

  /**
   * Capitalize skill name
   */
  private capitalizeSkill(skill: string): string {
    return skill
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}

export const skillDetectionService = new SkillDetectionService();
