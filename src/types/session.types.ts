/**
 * Session Types - UVP Onboarding Session Persistence
 *
 * Created: 2025-11-20
 */

import type {
  ProductService,
  CustomerProfile,
  TransformationGoal,
  UniqueSolution,
  KeyBenefit,
  CompleteUVP
} from './uvp-flow.types';

export type UVPStepKey = 'products' | 'customer' | 'transformation' | 'solution' | 'benefit' | 'synthesis';

export interface UVPSession {
  id: string;
  brand_id: string;
  session_name: string; // Company name
  website_url: string;
  current_step: UVPStepKey;

  // Step data
  products_data?: {
    categories: any[];
    selectedProducts: ProductService[];
  };
  customer_data?: {
    selected: CustomerProfile | null;
    suggestions: CustomerProfile[];
  };
  transformation_data?: {
    selected: TransformationGoal | null;
    suggestions: TransformationGoal[];
  };
  solution_data?: {
    selected: UniqueSolution | null;
    suggestions: UniqueSolution[];
  };
  benefit_data?: {
    selected: KeyBenefit | null;
    suggestions: KeyBenefit[];
  };
  complete_uvp?: CompleteUVP;

  // Background data
  scraped_content?: {
    content: string[];
    urls: string[];
  };
  industry_info?: {
    industry: string;
    specialization: string;
    naics_code?: string;
  };
  business_info?: {
    name: string;
    location: string;
  };

  // Progress
  completed_steps: UVPStepKey[];
  progress_percentage: number;

  // Metadata
  created_at: Date;
  updated_at: Date;
  last_accessed: Date;
}

export interface CreateSessionInput {
  brand_id: string;
  session_name: string;
  website_url: string;
  current_step: UVPStepKey;
  business_info?: {
    name: string;
    location: string;
  };
  industry_info?: {
    industry: string;
    specialization: string;
  };
}

export interface UpdateSessionInput {
  session_id: string;
  current_step?: UVPStepKey;
  products_data?: any;
  customer_data?: any;
  transformation_data?: any;
  solution_data?: any;
  benefit_data?: any;
  complete_uvp?: any;
  scraped_content?: any;
  industry_info?: any;
  business_info?: any;
  completed_steps?: UVPStepKey[];
  progress_percentage?: number;
}

export interface SessionListItem {
  id: string;
  session_name: string;
  website_url: string;
  current_step: UVPStepKey;
  progress_percentage: number;
  last_accessed: Date;
  created_at: Date;
  metadata?: {
    source?: 'database' | 'localStorage';
    isPending?: boolean;
    [key: string]: any;
  };
}
