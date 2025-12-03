// PRD Feature: GOVERNANCE-COMPLIANCE
/**
 * Industry API Service
 *
 * Frontend service for industry lookup data using edge functions
 * Replaces direct Supabase calls to comply with governance
 */

export interface NAICSCode {
  code: string;
  title: string;
  keywords: string;
  category: string;
  has_full_profile: boolean;
  popularity: number;
}

export interface IndustryProfile {
  id: string;
  name: string;
}

export interface IndustryData {
  naics: NAICSCode[];
  profiles: IndustryProfile[];
  errors?: {
    naics?: string;
    profiles?: string;
  };
}

class IndustryApiService {
  private baseUrl = process.env.REACT_APP_SUPABASE_URL || '';

  private async callIndustryFunction(endpoint: string = '') {
    const response = await fetch(`${this.baseUrl}/functions/v1/industries${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`Industry API warning: ${response.status}`);
      // Return empty data on error instead of throwing
      return endpoint === '/naics' ? [] : endpoint === '/profiles' ? [] : { naics: [], profiles: [] };
    }

    return response.json();
  }

  /**
   * Get all industry data (NAICS codes and profiles)
   */
  async getIndustryData(): Promise<IndustryData> {
    try {
      return await this.callIndustryFunction('');
    } catch (error) {
      console.warn('[IndustryService] Failed to load industry data:', error);
      return { naics: [], profiles: [] };
    }
  }

  /**
   * Get NAICS codes only
   */
  async getNAICSCodes(): Promise<NAICSCode[]> {
    try {
      return await this.callIndustryFunction('/naics');
    } catch (error) {
      console.warn('[IndustryService] Failed to load NAICS codes:', error);
      return [];
    }
  }

  /**
   * Get industry profiles only
   */
  async getIndustryProfiles(): Promise<IndustryProfile[]> {
    try {
      return await this.callIndustryFunction('/profiles');
    } catch (error) {
      console.warn('[IndustryService] Failed to load industry profiles:', error);
      return [];
    }
  }
}

export const industryApiService = new IndustryApiService();