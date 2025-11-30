/**
 * Proof UVP Alignment Service
 *
 * Scores how well proof points support specific UVP claims.
 * Matches proof to differentiators, benefits, and target customer statements.
 *
 * Created: 2025-11-29
 */

import type { CompleteUVP } from '@/types/uvp-flow.types';
import type { ConsolidatedProof } from './proof-consolidation.service';

// ============================================================================
// TYPES
// ============================================================================

export interface UVPClaim {
  id: string;
  type: 'differentiator' | 'benefit' | 'target-customer' | 'problem-solved';
  text: string;
  keywords: string[];
}

export interface ProofAlignment {
  proofId: string;
  claimId: string;
  claimType: UVPClaim['type'];
  claimText: string;
  alignmentScore: number;  // 0-100
  matchedKeywords: string[];
  explanation: string;
}

export interface AlignmentResult {
  proofId: string;
  alignments: ProofAlignment[];
  totalAlignmentScore: number;  // Sum of all alignment scores
  topClaim: string | null;  // Best matched claim
  supportsMultipleClaims: boolean;
}

// ============================================================================
// KEYWORD EXTRACTION
// ============================================================================

/**
 * Extract keywords from text for matching
 */
function extractKeywords(text: string): string[] {
  if (!text) return [];

  // Remove common stop words
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'our', 'your',
    'their', 'this', 'that', 'these', 'those', 'it', 'its', 'we', 'you', 'they'
  ]);

  // Extract words, filter stop words, keep meaningful terms
  const words = text
    .toLowerCase()
    .replace(/[^\w\s%$]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));

  // Also extract phrases (2-3 word combinations)
  const phrases: string[] = [];
  const wordArray = text.toLowerCase().split(/\s+/);
  for (let i = 0; i < wordArray.length - 1; i++) {
    phrases.push(`${wordArray[i]} ${wordArray[i + 1]}`);
    if (i < wordArray.length - 2) {
      phrases.push(`${wordArray[i]} ${wordArray[i + 1]} ${wordArray[i + 2]}`);
    }
  }

  return [...new Set([...words, ...phrases])];
}

// ============================================================================
// SERVICE
// ============================================================================

class ProofUVPAlignmentService {
  /**
   * Extract claims from UVP for matching
   */
  extractClaims(uvp: CompleteUVP | null): UVPClaim[] {
    if (!uvp) return [];

    const claims: UVPClaim[] = [];

    // Extract differentiators
    if (uvp.differentiators) {
      const diffs = Array.isArray(uvp.differentiators)
        ? uvp.differentiators
        : [uvp.differentiators];

      diffs.forEach((diff, i) => {
        const text = typeof diff === 'string' ? diff : diff?.text || diff?.value || '';
        if (text) {
          claims.push({
            id: `diff-${i}`,
            type: 'differentiator',
            text,
            keywords: extractKeywords(text)
          });
        }
      });
    }

    // Extract key benefit
    if (uvp.keyBenefit) {
      const benefit = typeof uvp.keyBenefit === 'string'
        ? uvp.keyBenefit
        : uvp.keyBenefit?.text || uvp.keyBenefit?.value || '';
      if (benefit) {
        claims.push({
          id: 'benefit-main',
          type: 'benefit',
          text: benefit,
          keywords: extractKeywords(benefit)
        });
      }
    }

    // Extract from target customer
    if (uvp.targetCustomer) {
      const tc = uvp.targetCustomer;

      // Who they serve
      if (tc.whoTheyServe) {
        claims.push({
          id: 'target-who',
          type: 'target-customer',
          text: tc.whoTheyServe,
          keywords: extractKeywords(tc.whoTheyServe)
        });
      }

      // Pain points they solve
      if (tc.painPoints && Array.isArray(tc.painPoints)) {
        tc.painPoints.forEach((pain, i) => {
          const text = typeof pain === 'string' ? pain : pain?.text || '';
          if (text) {
            claims.push({
              id: `pain-${i}`,
              type: 'problem-solved',
              text,
              keywords: extractKeywords(text)
            });
          }
        });
      }
    }

    // Extract from products/services
    if (uvp.productsServices) {
      const ps = uvp.productsServices;

      if (ps.mainOffering) {
        claims.push({
          id: 'offering-main',
          type: 'benefit',
          text: ps.mainOffering,
          keywords: extractKeywords(ps.mainOffering)
        });
      }

      if (ps.uniqueValue) {
        claims.push({
          id: 'unique-value',
          type: 'differentiator',
          text: ps.uniqueValue,
          keywords: extractKeywords(ps.uniqueValue)
        });
      }
    }

    return claims;
  }

  /**
   * Score alignment between a proof point and UVP claims
   */
  scoreAlignment(proof: ConsolidatedProof, claims: UVPClaim[]): AlignmentResult {
    const alignments: ProofAlignment[] = [];
    const proofKeywords = extractKeywords(proof.value);
    const proofTitle = extractKeywords(proof.title);
    const allProofKeywords = [...new Set([...proofKeywords, ...proofTitle])];

    for (const claim of claims) {
      const matchedKeywords: string[] = [];

      // Check keyword overlap
      for (const keyword of allProofKeywords) {
        for (const claimKeyword of claim.keywords) {
          // Exact match
          if (keyword === claimKeyword) {
            matchedKeywords.push(keyword);
          }
          // Partial match (one contains the other)
          else if (keyword.includes(claimKeyword) || claimKeyword.includes(keyword)) {
            if (keyword.length > 3 && claimKeyword.length > 3) {
              matchedKeywords.push(keyword);
            }
          }
        }
      }

      // Calculate alignment score
      const uniqueMatches = [...new Set(matchedKeywords)];
      const matchRatio = claim.keywords.length > 0
        ? uniqueMatches.length / claim.keywords.length
        : 0;

      // Base score from keyword matches
      let alignmentScore = Math.round(matchRatio * 100);

      // Boost for proof types that naturally support certain claim types
      if (claim.type === 'differentiator' && ['certification', 'award', 'metric'].includes(proof.type)) {
        alignmentScore = Math.min(100, alignmentScore + 15);
      }
      if (claim.type === 'benefit' && ['testimonial', 'review', 'metric'].includes(proof.type)) {
        alignmentScore = Math.min(100, alignmentScore + 15);
      }
      if (claim.type === 'problem-solved' && ['testimonial', 'review'].includes(proof.type)) {
        alignmentScore = Math.min(100, alignmentScore + 10);
      }

      // Only include meaningful alignments
      if (alignmentScore >= 20 || uniqueMatches.length >= 2) {
        alignments.push({
          proofId: proof.id,
          claimId: claim.id,
          claimType: claim.type,
          claimText: claim.text,
          alignmentScore,
          matchedKeywords: uniqueMatches,
          explanation: this.generateExplanation(proof, claim, uniqueMatches, alignmentScore)
        });
      }
    }

    // Sort by score
    alignments.sort((a, b) => b.alignmentScore - a.alignmentScore);

    // Calculate total alignment
    const totalAlignmentScore = alignments.reduce((sum, a) => sum + a.alignmentScore, 0);
    const topClaim = alignments.length > 0 ? alignments[0].claimText : null;
    const supportsMultipleClaims = alignments.filter(a => a.alignmentScore >= 40).length > 1;

    return {
      proofId: proof.id,
      alignments,
      totalAlignmentScore,
      topClaim,
      supportsMultipleClaims
    };
  }

  /**
   * Score all proofs against UVP claims
   */
  scoreAllProofs(proofs: ConsolidatedProof[], uvp: CompleteUVP | null): Map<string, AlignmentResult> {
    const claims = this.extractClaims(uvp);
    const results = new Map<string, AlignmentResult>();

    for (const proof of proofs) {
      const alignment = this.scoreAlignment(proof, claims);
      results.set(proof.id, alignment);
    }

    return results;
  }

  /**
   * Get proofs that validate a specific claim
   */
  getProofsForClaim(
    proofs: ConsolidatedProof[],
    uvp: CompleteUVP | null,
    claimId: string,
    minScore: number = 40
  ): ConsolidatedProof[] {
    const alignments = this.scoreAllProofs(proofs, uvp);

    const matchingProofs: Array<{ proof: ConsolidatedProof; score: number }> = [];

    for (const proof of proofs) {
      const alignment = alignments.get(proof.id);
      if (!alignment) continue;

      const claimAlignment = alignment.alignments.find(a => a.claimId === claimId);
      if (claimAlignment && claimAlignment.alignmentScore >= minScore) {
        matchingProofs.push({ proof, score: claimAlignment.alignmentScore });
      }
    }

    // Sort by score and return proofs
    return matchingProofs
      .sort((a, b) => b.score - a.score)
      .map(m => m.proof);
  }

  /**
   * Get top proofs that support the most claims
   */
  getMultiClaimProofs(
    proofs: ConsolidatedProof[],
    uvp: CompleteUVP | null,
    limit: number = 5
  ): ConsolidatedProof[] {
    const alignments = this.scoreAllProofs(proofs, uvp);

    const scoredProofs: Array<{ proof: ConsolidatedProof; total: number; count: number }> = [];

    for (const proof of proofs) {
      const alignment = alignments.get(proof.id);
      if (!alignment) continue;

      const significantAlignments = alignment.alignments.filter(a => a.alignmentScore >= 40);
      if (significantAlignments.length > 0) {
        scoredProofs.push({
          proof,
          total: alignment.totalAlignmentScore,
          count: significantAlignments.length
        });
      }
    }

    // Sort by count first, then by total score
    return scoredProofs
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return b.total - a.total;
      })
      .slice(0, limit)
      .map(s => s.proof);
  }

  /**
   * Generate human-readable explanation of alignment
   */
  private generateExplanation(
    proof: ConsolidatedProof,
    claim: UVPClaim,
    matchedKeywords: string[],
    score: number
  ): string {
    if (matchedKeywords.length === 0) {
      return `This ${proof.type} may support "${claim.text.substring(0, 50)}..."`;
    }

    const keywordStr = matchedKeywords.slice(0, 3).join(', ');

    if (score >= 70) {
      return `Strongly validates "${claim.text.substring(0, 40)}..." through ${keywordStr}`;
    } else if (score >= 40) {
      return `Supports "${claim.text.substring(0, 40)}..." with ${keywordStr}`;
    } else {
      return `Related to "${claim.text.substring(0, 40)}..." via ${keywordStr}`;
    }
  }
}

export const proofUVPAlignmentService = new ProofUVPAlignmentService();
export default proofUVPAlignmentService;
