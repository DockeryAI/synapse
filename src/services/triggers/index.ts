// PRD Feature: SYNAPSE-V6
// Trigger services - V6 simplified implementation

export * from './trigger-synthesis.service';
export * from './early-trigger-loader.service';

// Profile detection service stub
export interface BusinessProfileType {
  type: string;
  confidence: number;
}

export interface BusinessProfileAnalysis {
  profile: BusinessProfileType;
  signals: string[];
  confidence: number;
}

class ProfileDetectionService {
  async detectProfile(data: any): Promise<BusinessProfileType> {
    return {
      type: 'service_business',
      confidence: 0.8
    };
  }
}

export const profileDetectionService = new ProfileDetectionService();

// API management functions for streaming-api-manager compatibility
export const shouldRunApi = (apiName: string, context: any): boolean => {
  // V6 simplified - always allow
  return true;
};

export const getApiPriorityOrder = (context: any): string[] => {
  // V6 simplified priority order
  return ['serper', 'perplexity', 'buzzsumo'];
};

export const getApiWeight = (apiName: string): number => {
  // V6 simplified weights
  const weights: Record<string, number> = {
    serper: 3,
    perplexity: 2,
    buzzsumo: 1
  };
  return weights[apiName] || 1;
};

export const getEnabledApis = (): string[] => {
  // V6 simplified - return available APIs
  return ['serper', 'perplexity', 'buzzsumo'];
};
