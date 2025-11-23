/**
 * Extractor Types - Data extraction and parsing
 */

export interface ExtractorConfig {
  enableWebsiteContent?: boolean;
  enableCompetitorAnalysis?: boolean;
  enableIndustryResearch?: boolean;
}

export interface ExtractionResult {
  content: string;
  metadata: Record<string, unknown>;
  confidence: number;
}

export interface WebsiteContent {
  url: string;
  title?: string;
  description?: string;
  content: string;
  extractedAt: string;
}
