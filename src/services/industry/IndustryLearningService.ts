/**
 * ============================================================================
 * INDUSTRY LEARNING SERVICE - CONTINUOUS IMPROVEMENT FEEDBACK LOOP
 * ============================================================================
 *
 * Creates a self-improving system that learns from every interaction.
 *
 * LEARNING LOOP:
 * 1. Track outcomes → 2. Analyze patterns → 3. Generate insights →
 * 4. Refine profiles → 5. Improve quality → (repeat)
 *
 * WHAT IT LEARNS FROM:
 * - User accepted/rejected transformations
 * - User edits to generated content
 * - Content performance (if tracking is available)
 * - User ratings and feedback
 *
 * RESULT: Profiles get better over time, content gets more accurate
 */

import { llmService } from '../llm/LLMService';
import { supabase } from '../../utils/supabase/client';
import type { IndustryProfileV3 } from '../../types/onboarding-v3.types';

export interface ContentOutcome {
  brandId: string;
  industryCode: string;
  contentType: 'transformation' | 'social_post' | 'email' | 'bio' | 'calendar';
  contentText: string;
  outcomeType: 'user_accepted' | 'user_rejected' | 'user_edited' | 'engagement';
  outcomeScore: number; // 0-1 (0 = rejected, 0.5 = edited, 1 = accepted as-is)
  userRating?: number; // 1-5 stars if provided
  userFeedback?: string;
  successFactors?: string[]; // What worked
  failureFactors?: string[]; // What didn't work
  calibrationUsed?: any; // Snapshot of calibration at generation time
}

export interface LearningInsight {
  industryCode: string;
  pattern: string;
  confidence: number; // 0-1
  impact: number; // 0-1 (how much it should influence profile)
  contextData: any;
  learningType:
    | 'content_performance'
    | 'transformation_effectiveness'
    | 'user_feedback'
    | 'calibration_tuning';
}

export interface RefinementResult {
  industryCode: string;
  learningsApplied: number;
  changesMade: Array<{
    field: string;
    oldValue: any;
    newValue: any;
    reason: string;
  }>;
  qualityScoreIncrease: number;
  refinedProfile: IndustryProfileV3;
}

export class IndustryLearningService {
  /**
   * TRACK CONTENT OUTCOME
   * Call this every time content is generated and user interacts with it
   */
  async trackOutcome(outcome: ContentOutcome): Promise<void> {
    console.log(`[IndustryLearning] Tracking outcome for ${outcome.industryCode}: ${outcome.outcomeType}`);

    try {
      // Store in database
      await supabase.from('content_outcomes').insert({
        brand_id: outcome.brandId,
        industry_code: outcome.industryCode,
        content_type: outcome.contentType,
        content_text: outcome.contentText,
        outcome_type: outcome.outcomeType,
        outcome_score: outcome.outcomeScore,
        user_rating: outcome.userRating,
        user_feedback: outcome.userFeedback,
        success_factors: outcome.successFactors,
        failure_factors: outcome.failureFactors,
        calibration_used: outcome.calibrationUsed,
        generated_at: new Date().toISOString(),
        outcome_recorded_at: new Date().toISOString(),
      });

      // If outcome is poor or has feedback, generate immediate learning
      if (outcome.outcomeScore < 0.5 || outcome.userFeedback) {
        await this.generateLearningFromOutcome(outcome);
      }

      // Check if we should trigger profile refinement
      await this.checkRefinementTrigger(outcome.industryCode);
    } catch (error) {
      console.error('[IndustryLearning] Error tracking outcome:', error);
      // Don't throw - tracking failures shouldn't break the app
    }
  }

  /**
   * GENERATE LEARNING FROM SINGLE OUTCOME
   */
  private async generateLearningFromOutcome(outcome: ContentOutcome): Promise<void> {
    try {
      const prompt = `You are an expert analyzing content performance in the "${outcome.industryCode}" industry.

CONTEXT:
- Content Type: ${outcome.contentType}
- Outcome: ${outcome.outcomeType} (score: ${outcome.outcomeScore})
- User Rating: ${outcome.userRating || 'N/A'}
- User Feedback: ${outcome.userFeedback || 'None provided'}
- Content: "${outcome.contentText.substring(0, 500)}"

CALIBRATION USED:
${JSON.stringify(outcome.calibrationUsed, null, 2)}

TASK: Extract actionable learning insights.

ANALYZE:
1. What worked or didn't work?
2. Should calibration be adjusted? (emotional level, formality, etc.)
3. What patterns emerge?
4. How confident are you in this learning? (based on feedback clarity)
5. How much should this influence the profile? (impact score)

RESPOND WITH ONLY VALID JSON:
{
  "pattern": "Clear description of what was learned",
  "confidence": 0.85,
  "impact": 0.6,
  "learningType": "transformation_effectiveness",
  "recommendations": {
    "calibrationAdjustments": {
      "emotionalLevel": {
        "current": 0.75,
        "recommended": 0.80,
        "reason": "Why this change"
      }
    },
    "contentGuidance": ["Guidance 1", "Guidance 2"],
    "avoidPatterns": ["What to avoid"]
  },
  "reasoning": "2-3 sentences explaining this learning"
}`;

      const response = await llmService.learn(prompt, {
        industryCode: outcome.industryCode,
        brandId: outcome.brandId,
      });

      const learning = JSON.parse(response.content);

      // Store learning
      await supabase.from('industry_learnings').insert({
        industry_code: outcome.industryCode,
        learning_type: learning.learningType,
        pattern: learning.pattern,
        confidence: learning.confidence,
        impact: learning.impact,
        context_data: {
          outcomeType: outcome.outcomeType,
          outcomeScore: outcome.outcomeScore,
          userFeedback: outcome.userFeedback,
          recommendations: learning.recommendations,
          reasoning: learning.reasoning,
        },
        applied_to_profile: false,
        created_at: new Date().toISOString(),
      });

      console.log(`[IndustryLearning] Generated learning: "${learning.pattern}"`);
    } catch (error) {
      console.error('[IndustryLearning] Error generating learning:', error);
    }
  }

  /**
   * CHECK IF WE SHOULD TRIGGER PROFILE REFINEMENT
   * Triggers when we have enough unapplied learnings
   */
  private async checkRefinementTrigger(industryCode: string): Promise<void> {
    try {
      // Count unapplied learnings
      const { count } = await supabase
        .from('industry_learnings')
        .select('*', { count: 'exact', head: true })
        .eq('industry_code', industryCode)
        .eq('applied_to_profile', false);

      // Trigger refinement if we have 5+ unapplied learnings
      if (count && count >= 5) {
        console.log(
          `[IndustryLearning] ${count} unapplied learnings for ${industryCode} - triggering refinement`
        );
        await this.refineProfile(industryCode);
      }
    } catch (error) {
      console.error('[IndustryLearning] Error checking refinement trigger:', error);
    }
  }

  /**
   * REFINE PROFILE BASED ON LEARNINGS
   * Analyzes all unapplied learnings and updates the industry profile
   */
  async refineProfile(industryCode: string): Promise<RefinementResult | null> {
    console.log(`[IndustryLearning] Refining profile for ${industryCode}...`);

    try {
      // Get current profile
      const { data: currentProfileData } = await supabase
        .from('industry_profiles')
        .select('*')
        .eq('industry_code', industryCode)
        .single();

      if (!currentProfileData) {
        console.error(`[IndustryLearning] No profile found for ${industryCode}`);
        return null;
      }

      const currentProfile: IndustryProfileV3 = currentProfileData.profile_data;
      const currentQuality = currentProfileData.research_quality_score || 0;

      // Get unapplied learnings
      const { data: learnings } = await supabase
        .from('industry_learnings')
        .select('*')
        .eq('industry_code', industryCode)
        .eq('applied_to_profile', false)
        .order('created_at', { ascending: false })
        .limit(20); // Max 20 learnings per refinement

      if (!learnings || learnings.length === 0) {
        console.log(`[IndustryLearning] No unapplied learnings for ${industryCode}`);
        return null;
      }

      console.log(`[IndustryLearning] Applying ${learnings.length} learnings...`);

      // Use LLM to analyze learnings and propose refinements
      const prompt = `You are an expert refining an industry profile based on real-world learnings.

INDUSTRY: ${industryCode}

CURRENT PROFILE:
${JSON.stringify(currentProfile, null, 2)}

LEARNINGS TO APPLY (${learnings.length} total):
${learnings.map((l, i) => `
${i + 1}. ${l.pattern}
   - Confidence: ${l.confidence}
   - Impact: ${l.impact}
   - Type: ${l.learning_type}
   - Context: ${JSON.stringify(l.context_data, null, 2)}
`).join('\n')}

TASK: Propose precise refinements to the profile.

ANALYZE:
1. What patterns emerge across these learnings?
2. Which calibration settings should be adjusted? (be precise - e.g., 0.75 → 0.80)
3. What content guidance should be updated?
4. Which learnings have highest confidence + impact?

RESPOND WITH ONLY VALID JSON:
{
  "changesMade": [
    {
      "field": "calibration.emotionalLevel",
      "oldValue": 0.75,
      "newValue": 0.80,
      "reason": "Learnings show users respond better to more emotional messaging",
      "supportingLearnings": 3
    }
  ],
  "updatedCalibration": {
    "emotionalLevel": 0.80,
    "formalityLevel": 0.3,
    "urgencyLevel": 0.5,
    "technicalLevel": 0.2,
    "transformationApproach": "emotional",
    "primaryValueDrivers": ["updated", "values"],
    "avoidancePatterns": ["updated", "patterns"],
    "powerWords": ["updated", "words"],
    "avoidPhrases": ["updated", "phrases"]
  },
  "confidenceInChanges": 0.85,
  "expectedQualityIncrease": 0.05,
  "reasoning": "3-4 sentences explaining the refinements and their rationale"
}`;

      const response = await llmService.refine(prompt, { industryCode });
      const refinement = JSON.parse(response.content);

      // Apply refinements to profile
      const refinedProfile: IndustryProfileV3 = {
        ...currentProfile,
        calibration: refinement.updatedCalibration,
      };

      // Calculate new quality score
      const newQuality = Math.min(
        currentQuality + (refinement.expectedQualityIncrease || 0.05),
        1.0
      );

      // Save refined profile
      await supabase
        .from('industry_profiles')
        .update({
          profile_data: refinedProfile,
          research_quality_score: newQuality,
          last_refined_at: new Date().toISOString(),
          refinement_count: (currentProfileData.refinement_count || 0) + 1,
        })
        .eq('industry_code', industryCode);

      // Mark learnings as applied
      const learningIds = learnings.map((l) => l.id);
      await supabase
        .from('industry_learnings')
        .update({
          applied_to_profile: true,
          applied_at: new Date().toISOString(),
        })
        .in('id', learningIds);

      // Log refinement
      await supabase.from('profile_refinements').insert({
        profile_id: currentProfileData.id,
        industry_code: industryCode,
        refinement_type: 'ai_learning',
        changes_made: refinement.changesMade,
        learnings_applied: learnings.length,
        learning_ids: learningIds,
        confidence_increase: refinement.confidenceInChanges,
        quality_score_before: currentQuality,
        quality_score_after: newQuality,
        refined_at: new Date().toISOString(),
        refined_by: 'ai_learning_service',
      });

      console.log(
        `[IndustryLearning] Refinement complete for ${industryCode}: ${refinement.changesMade.length} changes, quality ${currentQuality.toFixed(2)} → ${newQuality.toFixed(2)}`
      );

      return {
        industryCode,
        learningsApplied: learnings.length,
        changesMade: refinement.changesMade,
        qualityScoreIncrease: newQuality - currentQuality,
        refinedProfile,
      };
    } catch (error) {
      console.error('[IndustryLearning] Error refining profile:', error);
      return null;
    }
  }

  /**
   * GET LEARNING INSIGHTS FOR AN INDUSTRY
   * Shows what the system has learned (useful for debugging/transparency)
   */
  async getLearningInsights(industryCode: string): Promise<{
    totalLearnings: number;
    appliedLearnings: number;
    pendingLearnings: number;
    recentLearnings: Array<{
      pattern: string;
      confidence: number;
      createdAt: string;
      applied: boolean;
    }>;
    refinementHistory: Array<{
      refinedAt: string;
      learningsApplied: number;
      qualityIncrease: number;
    }>;
  } | null> {
    try {
      // Get learning counts
      const { data: allLearnings } = await supabase
        .from('industry_learnings')
        .select('*')
        .eq('industry_code', industryCode);

      if (!allLearnings) {
        return null;
      }

      const applied = allLearnings.filter((l) => l.applied_to_profile).length;
      const pending = allLearnings.length - applied;

      // Get recent learnings
      const recentLearnings = allLearnings
        .slice(0, 10)
        .map((l) => ({
          pattern: l.pattern,
          confidence: l.confidence,
          createdAt: l.created_at,
          applied: l.applied_to_profile,
        }));

      // Get refinement history
      const { data: refinements } = await supabase
        .from('profile_refinements')
        .select('*')
        .eq('industry_code', industryCode)
        .order('refined_at', { ascending: false })
        .limit(5);

      const refinementHistory = (refinements || []).map((r) => ({
        refinedAt: r.refined_at,
        learningsApplied: r.learnings_applied,
        qualityIncrease: r.quality_score_after - r.quality_score_before,
      }));

      return {
        totalLearnings: allLearnings.length,
        appliedLearnings: applied,
        pendingLearnings: pending,
        recentLearnings,
        refinementHistory,
      };
    } catch (error) {
      console.error('[IndustryLearning] Error getting insights:', error);
      return null;
    }
  }

  /**
   * MANUAL REFINEMENT TRIGGER
   * Allows manual triggering of profile refinement (for admin/testing)
   */
  async triggerRefinement(industryCode: string): Promise<RefinementResult | null> {
    console.log(`[IndustryLearning] Manually triggered refinement for ${industryCode}`);
    return this.refineProfile(industryCode);
  }

  /**
   * GET RECENT OUTCOMES FOR LEARNING PATTERN ANALYSIS
   * Used by MessageTransformationService to learn from past successes/failures
   */
  async getRecentOutcomes(
    industryCode: string,
    contentType: string,
    minScore: number = 0.0
  ): Promise<ContentOutcome[]> {
    try {
      const { data: outcomes } = await supabase
        .from('content_outcomes')
        .select('*')
        .eq('industry_code', industryCode)
        .eq('content_type', contentType)
        .gte('outcome_score', minScore)
        .order('outcome_recorded_at', { ascending: false })
        .limit(10);

      if (!outcomes) {
        return [];
      }

      return outcomes.map(o => ({
        brandId: o.brand_id,
        industryCode: o.industry_code,
        contentType: o.content_type,
        contentText: o.content_text,
        outcomeType: o.outcome_type,
        outcomeScore: o.outcome_score,
        userRating: o.user_rating,
        userFeedback: o.user_feedback,
        successFactors: o.success_factors,
        failureFactors: o.failure_factors,
        calibrationUsed: o.calibration_used
      }));
    } catch (error) {
      console.error('[IndustryLearning] Error getting recent outcomes:', error);
      return [];
    }
  }
}

// Export singleton
export const industryLearningService = new IndustryLearningService();
