/**
 * EQ Learning Engine
 *
 * Auto-learns specialty EQ baselines without manual configuration
 *
 * Process:
 * 1. Store pattern signatures for each calculation
 * 2. Cluster similar patterns (vector similarity)
 * 3. After 5+ similar patterns → Create specialty baseline
 * 4. Continuously refine baselines as more data comes in
 *
 * Created: 2025-11-19
 */

import type {
  PatternSignature,
  PatternMatch,
  LearningRecord,
  SpecialtyCluster,
  SpecialtyEQMapping
} from '@/types/eq-calculator.types';

/**
 * In-memory storage (will be replaced with database)
 * This is temporary for MVP - production will use Supabase
 */
class InMemoryStore {
  private patterns: Map<string, PatternSignature> = new Map();
  private learningRecords: Map<string, LearningRecord> = new Map();
  private specialtyClusters: Map<string, SpecialtyCluster> = new Map();
  private specialtyMappings: Map<string, SpecialtyEQMapping> = new Map();

  // Pattern storage
  storePattern(pattern: PatternSignature): void {
    this.patterns.set(pattern.id, pattern);
  }

  getPattern(id: string): PatternSignature | undefined {
    return this.patterns.get(id);
  }

  getAllPatterns(): PatternSignature[] {
    return Array.from(this.patterns.values());
  }

  // Learning record storage
  storeLearningRecord(record: LearningRecord): void {
    this.learningRecords.set(record.id, record);
  }

  getLearningRecord(id: string): LearningRecord | undefined {
    return this.learningRecords.get(id);
  }

  getAllLearningRecords(): LearningRecord[] {
    return Array.from(this.learningRecords.values());
  }

  // Specialty cluster storage
  storeCluster(cluster: SpecialtyCluster): void {
    this.specialtyClusters.set(cluster.cluster_id, cluster);
  }

  getCluster(id: string): SpecialtyCluster | undefined {
    return this.specialtyClusters.get(id);
  }

  getAllClusters(): SpecialtyCluster[] {
    return Array.from(this.specialtyClusters.values());
  }

  // Specialty mapping storage
  storeSpecialtyMapping(mapping: SpecialtyEQMapping): void {
    this.specialtyMappings.set(mapping.specialty.toLowerCase(), mapping);
  }

  getSpecialtyMapping(specialty: string): SpecialtyEQMapping | undefined {
    return this.specialtyMappings.get(specialty.toLowerCase());
  }

  getAllSpecialtyMappings(): SpecialtyEQMapping[] {
    return Array.from(this.specialtyMappings.values());
  }
}

/**
 * EQ Learning Engine Service
 */
class EQLearningEngineService {
  private store = new InMemoryStore();
  private readonly CLUSTER_THRESHOLD = 5;  // Min patterns to create specialty baseline
  private readonly SIMILARITY_THRESHOLD = 0.7;  // Min similarity to match patterns

  /**
   * Record a new calculation for learning
   */
  async recordCalculation(
    businessName: string,
    specialty: string | undefined,
    websiteUrl: string,
    eqScore: any,
    patternSignature: PatternSignature
  ): Promise<void> {
    console.log('[LearningEngine] Recording calculation:', {
      businessName,
      specialty,
      calculatedEQ: eqScore.overall
    });

    // Store pattern
    this.store.storePattern(patternSignature);

    // Create learning record
    const record: LearningRecord = {
      id: `learn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      business_name: businessName,
      specialty,
      website_url: websiteUrl,
      calculated_eq: eqScore,
      pattern_signature: patternSignature,
      created_at: new Date().toISOString()
    };

    this.store.storeLearningRecord(record);

    // Try to form clusters
    if (specialty) {
      await this.tryFormCluster(specialty);
    }
  }

  /**
   * Find similar patterns for an unknown specialty
   */
  async findSimilarPatterns(
    patternSignature: PatternSignature,
    limit: number = 5
  ): Promise<PatternMatch[]> {
    const allPatterns = this.store.getAllPatterns();
    const matches: PatternMatch[] = [];

    for (const existingPattern of allPatterns) {
      if (existingPattern.id === patternSignature.id) continue;

      const similarity = this.calculatePatternSimilarity(
        patternSignature,
        existingPattern
      );

      if (similarity >= this.SIMILARITY_THRESHOLD) {
        matches.push({
          matched_pattern: existingPattern,
          similarity_score: similarity * 100,
          eq_estimate: existingPattern.calculated_eq
        });
      }
    }

    // Sort by similarity (highest first)
    matches.sort((a, b) => b.similarity_score - a.similarity_score);

    return matches.slice(0, limit);
  }

  /**
   * Get learned EQ baseline for a specialty
   */
  async getSpecialtyBaseline(specialty: string): Promise<number | undefined> {
    const mapping = this.store.getSpecialtyMapping(specialty);
    return mapping?.base_eq;
  }

  /**
   * Get all learned specialty mappings
   */
  async getAllSpecialtyMappings(): Promise<SpecialtyEQMapping[]> {
    return this.store.getAllSpecialtyMappings();
  }

  /**
   * Try to form a cluster for a specialty
   * Creates baseline if enough similar patterns exist
   */
  private async tryFormCluster(specialty: string): Promise<void> {
    // Get all records for this specialty
    const allRecords = this.store.getAllLearningRecords();
    const specialtyRecords = allRecords.filter(
      r => r.specialty?.toLowerCase() === specialty.toLowerCase()
    );

    console.log('[LearningEngine] Checking cluster formation:', {
      specialty,
      recordCount: specialtyRecords.length,
      threshold: this.CLUSTER_THRESHOLD
    });

    // Need minimum records to form cluster
    if (specialtyRecords.length < this.CLUSTER_THRESHOLD) {
      console.log('[LearningEngine] Not enough records yet');
      return;
    }

    // Calculate average EQ
    const eqScores = specialtyRecords.map(r => r.calculated_eq.overall);
    const averageEQ = Math.round(
      eqScores.reduce((sum, eq) => sum + eq, 0) / eqScores.length
    );

    // Calculate pattern characteristics
    const emotionalDensities = specialtyRecords.map(
      r => r.pattern_signature.keyword_density.emotional
    );
    const rationalDensities = specialtyRecords.map(
      r => r.pattern_signature.keyword_density.rational
    );

    const avgEmotionalDensity =
      emotionalDensities.reduce((sum, d) => sum + d, 0) / emotionalDensities.length;
    const avgRationalDensity =
      rationalDensities.reduce((sum, d) => sum + d, 0) / rationalDensities.length;

    // Get common signals across all patterns
    const allSignals = specialtyRecords.flatMap(
      r => r.pattern_signature.detected_keywords
    );
    const signalCounts = new Map<string, number>();
    allSignals.forEach(signal => {
      signalCounts.set(signal, (signalCounts.get(signal) || 0) + 1);
    });

    const commonSignals = Array.from(signalCounts.entries())
      .filter(([_, count]) => count >= this.CLUSTER_THRESHOLD * 0.6)  // 60% of records
      .map(([signal]) => signal)
      .slice(0, 10);

    // Create cluster
    const clusterId = `cluster-${specialty.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    const cluster: SpecialtyCluster = {
      cluster_id: clusterId,
      specialty_names: [specialty],
      average_eq: averageEQ,
      pattern_characteristics: {
        avg_emotional_density: avgEmotionalDensity,
        avg_rational_density: avgRationalDensity,
        common_signals: commonSignals
      },
      sample_size: specialtyRecords.length,
      confidence: this.calculateClusterConfidence(specialtyRecords.length)
    };

    this.store.storeCluster(cluster);

    // Create specialty mapping
    const mapping: SpecialtyEQMapping = {
      specialty,
      base_eq: averageEQ,
      is_passion_product: averageEQ >= 70,
      sample_size: specialtyRecords.length,
      last_updated: new Date().toISOString(),
      examples: specialtyRecords.map(r => r.business_name).slice(0, 5)
    };

    this.store.storeSpecialtyMapping(mapping);

    console.log('[LearningEngine] Cluster formed!', {
      specialty,
      averageEQ,
      sampleSize: specialtyRecords.length,
      confidence: cluster.confidence
    });
  }

  /**
   * Calculate similarity between two pattern signatures
   * Uses keyword overlap + structural similarity
   */
  private calculatePatternSimilarity(
    pattern1: PatternSignature,
    pattern2: PatternSignature
  ): number {
    // Keyword overlap similarity
    const keywords1 = new Set(pattern1.detected_keywords);
    const keywords2 = new Set(pattern2.detected_keywords);
    const intersection = new Set(
      Array.from(keywords1).filter(k => keywords2.has(k))
    );
    const union = new Set([...keywords1, ...keywords2]);
    const keywordSimilarity = intersection.size / union.size;

    // Density similarity
    const emotionalDiff = Math.abs(
      pattern1.keyword_density.emotional - pattern2.keyword_density.emotional
    );
    const rationalDiff = Math.abs(
      pattern1.keyword_density.rational - pattern2.keyword_density.rational
    );
    const densitySimilarity = 1 - ((emotionalDiff + rationalDiff) / 200);  // Normalize to 0-1

    // Structural similarity
    const struct1 = pattern1.structural_signals;
    const struct2 = pattern2.structural_signals;
    let structuralMatches = 0;
    let structuralTotal = 5;  // Number of structural signals

    if (struct1.has_testimonials === struct2.has_testimonials) structuralMatches++;
    if (struct1.has_forums === struct2.has_forums) structuralMatches++;
    if (struct1.has_pricing_tables === struct2.has_pricing_tables) structuralMatches++;
    if (struct1.has_comparison_charts === struct2.has_comparison_charts) structuralMatches++;
    if (struct1.has_contact_only_pricing === struct2.has_contact_only_pricing) structuralMatches++;

    const structuralSimilarity = structuralMatches / structuralTotal;

    // Weighted combination
    const overallSimilarity =
      (keywordSimilarity * 0.4) +
      (densitySimilarity * 0.3) +
      (structuralSimilarity * 0.3);

    return overallSimilarity;
  }

  /**
   * Calculate cluster confidence based on sample size
   */
  private calculateClusterConfidence(sampleSize: number): number {
    if (sampleSize >= 20) return 95;
    if (sampleSize >= 15) return 90;
    if (sampleSize >= 10) return 85;
    if (sampleSize >= 7) return 80;
    if (sampleSize >= 5) return 75;
    return 70;
  }

  /**
   * Estimate EQ for unknown specialty using similar patterns
   */
  async estimateEQForUnknownSpecialty(
    patternSignature: PatternSignature
  ): Promise<{ estimatedEQ: number; confidence: number }> {
    const similarPatterns = await this.findSimilarPatterns(patternSignature);

    if (similarPatterns.length === 0) {
      return {
        estimatedEQ: 50,  // Default neutral
        confidence: 30
      };
    }

    // Weighted average based on similarity
    let weightedSum = 0;
    let totalWeight = 0;

    similarPatterns.forEach(match => {
      const weight = match.similarity_score / 100;
      weightedSum += match.eq_estimate * weight;
      totalWeight += weight;
    });

    const estimatedEQ = Math.round(weightedSum / totalWeight);
    const confidence = Math.min(90, 50 + similarPatterns.length * 5);

    console.log('[LearningEngine] Estimated EQ for unknown specialty:', {
      estimatedEQ,
      confidence,
      basedOnPatterns: similarPatterns.length
    });

    return { estimatedEQ, confidence };
  }

  /**
   * Get statistics about the learning system
   */
  async getStatistics(): Promise<{
    total_patterns: number;
    total_records: number;
    total_clusters: number;
    total_specialties_learned: number;
    avg_cluster_size: number;
  }> {
    const patterns = this.store.getAllPatterns();
    const records = this.store.getAllLearningRecords();
    const clusters = this.store.getAllClusters();
    const specialties = this.store.getAllSpecialtyMappings();

    const avgClusterSize = clusters.length > 0
      ? clusters.reduce((sum, c) => sum + c.sample_size, 0) / clusters.length
      : 0;

    return {
      total_patterns: patterns.length,
      total_records: records.length,
      total_clusters: clusters.length,
      total_specialties_learned: specialties.length,
      avg_cluster_size: Math.round(avgClusterSize)
    };
  }
}

// Export singleton instance
export const eqLearningEngine = new EQLearningEngineService();
export { EQLearningEngineService };
