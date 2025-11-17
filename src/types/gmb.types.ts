/**
 * Google My Business (GMB) Types
 *
 * Because Google's API documentation is a masterclass in "good luck figuring this out"
 */

export interface GMBAccount {
  name: string;
  accountName: string;
  type: 'PERSONAL' | 'ORGANIZATION';
  state: {
    status: 'UNVERIFIED' | 'VERIFIED' | 'SUSPENDED' | 'DISABLED';
  };
}

export interface GMBLocation {
  name: string; // Resource name: accounts/{account_id}/locations/{location_id}
  languageCode: string;
  storeCode?: string;
  locationName: string;
  primaryPhone: string;
  additionalPhones?: string[];
  address: GMBAddress;
  primaryCategory: GMBCategory;
  additionalCategories?: GMBCategory[];
  websiteUrl?: string;
  regularHours?: GMBBusinessHours;
  specialHours?: GMBSpecialHours;
  locationState?: {
    isGoogleUpdated: boolean;
    isDuplicate: boolean;
    isVerified: boolean;
    canUpdate: boolean;
    canDelete: boolean;
    isPublished: boolean;
  };
  metadata?: {
    mapsUrl: string;
    newReviewUrl: string;
  };
}

export interface GMBAddress {
  regionCode: string; // ISO 3166-1 alpha-2 country code (e.g., 'US', 'GB')
  languageCode: string; // BCP-47 language code (e.g., 'en-US')
  postalCode: string;
  administrativeArea: string; // State/province
  locality: string; // City
  addressLines: string[];
}

export interface GMBCategory {
  name: string;
  displayName: string;
  categoryId?: string;
  serviceTypes?: GMBServiceType[];
}

export interface GMBServiceType {
  serviceTypeId: string;
  displayName: string;
}

export interface GMBBusinessHours {
  periods: GMBTimePeriod[];
}

export interface GMBTimePeriod {
  openDay: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
  openTime: string; // HH:MM format
  closeDay: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
  closeTime: string; // HH:MM format
}

export interface GMBSpecialHours {
  specialHourPeriods: GMBSpecialHourPeriod[];
}

export interface GMBSpecialHourPeriod {
  startDate: {
    year: number;
    month: number;
    day: number;
  };
  openTime?: string;
  closeTime?: string;
  isClosed: boolean;
}

/**
 * GMB Post Types
 * Because there are FOUR different types and they all work slightly differently
 */
export type GMBPostType = 'UPDATE' | 'OFFER' | 'EVENT' | 'PRODUCT';

export interface GMBPostBase {
  name?: string; // Resource name (returned after creation)
  languageCode: string;
  summary: string;
  callToAction?: GMBCallToAction;
  media?: GMBMedia[];
  topicType?: string;
  alertType?: 'COVID_19';
  state?: 'LIVE' | 'REJECTED';
  createTime?: string;
  updateTime?: string;
  searchUrl?: string;
}

export interface GMBUpdatePost extends GMBPostBase {
  // Standard update post - no special fields
}

export interface GMBOfferPost extends GMBPostBase {
  offer: {
    couponCode?: string;
    redeemOnlineUrl?: string;
    termsConditions?: string;
  };
  event: {
    title: string;
    schedule: {
      startDate: GMBDate;
      startTime?: GMBTime;
      endDate: GMBDate;
      endTime?: GMBTime;
    };
  };
}

export interface GMBEventPost extends GMBPostBase {
  event: {
    title: string;
    schedule: {
      startDate: GMBDate;
      startTime?: GMBTime;
      endDate: GMBDate;
      endTime?: GMBTime;
    };
  };
}

export interface GMBProductPost extends GMBPostBase {
  // Product posts are deprecated but still supported
  // Use local inventory instead for proper product management
}

export type GMBPost = GMBUpdatePost | GMBOfferPost | GMBEventPost | GMBProductPost;

export interface GMBCallToAction {
  actionType: 'BOOK' | 'ORDER' | 'SHOP' | 'LEARN_MORE' | 'SIGN_UP' | 'CALL';
  url?: string;
}

export interface GMBMedia {
  mediaFormat: 'PHOTO' | 'VIDEO';
  sourceUrl?: string;
  googleUrl?: string;
  name?: string;
  createTime?: string;
  mediaId?: string;
  locationAssociation?: {
    category: 'PROFILE' | 'LOGO' | 'COVER' | 'PREFERRED' | 'ADDITIONAL';
    priceListItemId?: string;
  };
  attribution?: {
    profileName?: string;
    profilePhotoUrl?: string;
  };
}

export interface GMBDate {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
}

export interface GMBTime {
  hours: number; // 0-23
  minutes: number; // 0-59
  seconds?: number;
  nanos?: number;
}

/**
 * OAuth & Authentication
 */
export interface GMBAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface GMBAuthTokens {
  access_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

export interface GMBConnection {
  id: string;
  user_id: string;
  account_id: string;
  account_name: string;
  access_token: string;
  refresh_token: string;
  token_expiry: Date;
  connected_at: Date;
  last_synced: Date | null;
  status: 'active' | 'expired' | 'disconnected';
  locations: GMBLocationSummary[];
}

export interface GMBLocationSummary {
  location_id: string;
  location_name: string;
  address: string;
  is_verified: boolean;
  is_enabled_for_posting: boolean;
}

/**
 * Scheduling & Queue Management
 */
export interface GMBScheduledPost {
  id: string;
  user_id: string;
  location_id: string;
  campaign_id?: string;
  post_type: GMBPostType;
  content: Partial<GMBPost>;
  scheduled_for: Date;
  status: 'pending' | 'published' | 'failed' | 'cancelled';
  published_at?: Date;
  gmb_post_name?: string; // Resource name from GMB API
  error_message?: string;
  retry_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface GMBPostingSchedule {
  location_id: string;
  frequency: 'daily' | 'twice_weekly' | 'weekly' | 'custom';
  days_of_week?: number[]; // 0-6, where 0 is Sunday
  time_of_day?: string; // HH:MM format
  post_type_rotation?: GMBPostType[];
  enabled: boolean;
}

/**
 * Content Generation
 */
export interface GMBPostTemplate {
  type: GMBPostType;
  template: string;
  variables: string[];
  call_to_action?: GMBCallToAction['actionType'];
  requires_image: boolean;
  requires_dates?: boolean;
}

export interface GMBContentGenerationRequest {
  business_name: string;
  industry: string;
  specialty?: string;
  location: string;
  post_type: GMBPostType;
  campaign_context?: {
    campaign_id: string;
    campaign_type: string;
    theme: string;
  };
  products?: Array<{
    name: string;
    description: string;
    price?: string;
  }>;
}

/**
 * Analytics & Performance (for future use)
 */
export interface GMBPostInsights {
  post_name: string;
  views: number;
  clicks: number;
  calls: number;
  direction_requests: number;
  website_clicks: number;
}

/**
 * API Response Types
 */
export interface GMBListAccountsResponse {
  accounts: GMBAccount[];
  nextPageToken?: string;
}

export interface GMBListLocationsResponse {
  locations: GMBLocation[];
  nextPageToken?: string;
  totalSize: number;
}

export interface GMBCreatePostResponse {
  name: string; // Resource name
  languageCode: string;
  summary: string;
  createTime: string;
  updateTime: string;
  state: 'LIVE' | 'REJECTED';
  searchUrl: string;
}

/**
 * Error Handling
 */
export interface GMBApiError {
  code: number;
  message: string;
  status: string;
  details?: Array<{
    '@type': string;
    [key: string]: any;
  }>;
}

export interface GMBServiceError extends Error {
  code: 'AUTH_ERROR' | 'API_ERROR' | 'QUOTA_ERROR' | 'NOT_FOUND' | 'VALIDATION_ERROR';
  statusCode?: number;
  originalError?: any;
}

/**
 * Service Configuration
 */
export interface GMBServiceConfig {
  maxRetries: number;
  retryDelay: number; // milliseconds
  requestTimeout: number; // milliseconds
  enableAutoRefresh: boolean;
}
