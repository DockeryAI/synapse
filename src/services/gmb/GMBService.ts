/**
 * Google My Business Service
 *
 * Handles OAuth, location management, and posting to GMB.
 * Because nothing says "fun" like wrestling with Google's OAuth flow.
 *
 * @see https://developers.google.com/my-business/content/overview
 */

import { google, mybusinessbusinessinformation_v1, mybusinessaccountmanagement_v1 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { supabase } from '../../lib/supabase';
import type {
  GMBAccount,
  GMBLocation,
  GMBPost,
  GMBPostType,
  GMBAuthTokens,
  GMBConnection,
  GMBCreatePostResponse,
  GMBServiceError,
  GMBServiceConfig,
  GMBListLocationsResponse,
  GMBMedia,
} from '../../types/gmb.types';

export class GMBService {
  private oauth2Client: OAuth2Client;
  private config: GMBServiceConfig;
  private static readonly SCOPES = [
    'https://www.googleapis.com/auth/business.manage',
  ];

  constructor(config?: Partial<GMBServiceConfig>) {
    this.config = {
      maxRetries: 3,
      retryDelay: 1000,
      requestTimeout: 30000,
      enableAutoRefresh: true,
      ...config,
    };

    // Initialize OAuth2 client
    this.oauth2Client = new google.auth.OAuth2(
      process.env.VITE_GOOGLE_CLIENT_ID,
      process.env.VITE_GOOGLE_CLIENT_SECRET,
      process.env.VITE_GOOGLE_REDIRECT_URI || `${window.location.origin}/auth/google/callback`
    );

    // Enable automatic token refresh
    if (this.config.enableAutoRefresh) {
      this.oauth2Client.on('tokens', (tokens) => {
        this.handleTokenRefresh(tokens).catch(console.error);
      });
    }
  }

  /**
   * Step 1: Generate OAuth URL for user authorization
   */
  getAuthUrl(userId: string): string {
    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: GMBService.SCOPES,
      state: userId, // Pass user ID in state for callback
      prompt: 'consent', // Force consent to get refresh token
    });

    return authUrl;
  }

  /**
   * Step 2: Exchange authorization code for tokens
   */
  async handleAuthCallback(code: string, userId: string): Promise<GMBConnection> {
    try {
      // Exchange code for tokens
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);

      if (!tokens.access_token || !tokens.refresh_token) {
        throw this.createError('AUTH_ERROR', 'Failed to obtain access tokens', 401);
      }

      // Get account information
      const accounts = await this.listAccounts();
      if (accounts.length === 0) {
        throw this.createError('NOT_FOUND', 'No GMB accounts found', 404);
      }

      // Use first account (most businesses have only one)
      const account = accounts[0];

      // Get locations for this account
      const locations = await this.listLocations(account.name);

      // Save connection to database
      const gmbTokens: GMBAuthTokens = {
        access_token: tokens.access_token || '',
        refresh_token: tokens.refresh_token || '',
        expiry_date: tokens.expiry_date,
        scope: tokens.scope || '',
        token_type: tokens.token_type || 'Bearer',
      };
      const connection = await this.saveConnection(userId, account, gmbTokens, locations);

      return connection;
    } catch (error) {
      console.error('GMB auth callback error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get stored tokens and initialize client
   */
  async loadConnection(userId: string): Promise<GMBConnection | null> {
    try {
      const { data, error } = await supabase
        .from('gmb_connections')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (error || !data) {
        return null;
      }

      // Set credentials
      this.oauth2Client.setCredentials({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expiry_date: new Date(data.token_expiry).getTime(),
      });

      // Check if token needs refresh
      if (new Date(data.token_expiry) <= new Date()) {
        await this.refreshAccessToken(data.id);
      }

      return data as GMBConnection;
    } catch (error) {
      console.error('Error loading GMB connection:', error);
      return null;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(connectionId: string): Promise<void> {
    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();

      if (!credentials.access_token) {
        throw new Error('Failed to refresh access token');
      }

      // Update database with new tokens
      const expiryDate = credentials.expiry_date
        ? new Date(credentials.expiry_date)
        : new Date(Date.now() + 3600 * 1000); // Default 1 hour

      await supabase
        .from('gmb_connections')
        .update({
          access_token: credentials.access_token,
          token_expiry: expiryDate.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', connectionId);

      this.oauth2Client.setCredentials(credentials);
    } catch (error) {
      console.error('Error refreshing GMB token:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Handle automatic token refresh
   */
  private async handleTokenRefresh(tokens: any): Promise<void> {
    // This is called automatically when tokens are refreshed
    // Update database with new tokens if we have a connection ID
    console.log('GMB tokens refreshed automatically');
  }

  /**
   * List all GMB accounts for authenticated user
   */
  async listAccounts(): Promise<GMBAccount[]> {
    try {
      const accountManagement = google.mybusinessaccountmanagement({
        version: 'v1',
        auth: this.oauth2Client,
      });

      const response = await accountManagement.accounts.list();
      return (response.data.accounts || []) as GMBAccount[];
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * List all locations for a GMB account
   */
  async listLocations(accountName: string): Promise<GMBLocation[]> {
    try {
      const businessInfo = google.mybusinessbusinessinformation({
        version: 'v1',
        auth: this.oauth2Client,
      });

      const response = await businessInfo.accounts.locations.list({
        parent: accountName,
        readMask: 'name,title,storefrontAddress,phoneNumbers,categories,websiteUri,metadata',
      });

      return (response.data.locations || []) as unknown as GMBLocation[];
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create a post on GMB
   */
  async createPost(
    locationName: string,
    postType: GMBPostType,
    content: Partial<GMBPost>
  ): Promise<GMBCreatePostResponse> {
    try {
      // Note: Google deprecated the Posts API in 2021
      // You'll need to use the Google My Business API v4 or Business Profile API
      // This is a placeholder for the implementation

      // For MVP, we'll use the Business Profile Performance API
      const businessProfile = google.mybusinessbusinessinformation({
        version: 'v1',
        auth: this.oauth2Client,
      });

      // TODO: Implement actual post creation
      // The Posts API is deprecated, so we need to use Business Profile API
      // or consider using Google My Business Management API v4

      throw this.createError(
        'API_ERROR',
        'GMB Posts API is deprecated. Use Business Profile Performance API instead.',
        501
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create an UPDATE post (standard post)
   */
  async createUpdatePost(
    locationName: string,
    summary: string,
    callToAction?: { actionType: string; url?: string },
    mediaUrls?: string[]
  ): Promise<GMBCreatePostResponse> {
    const post: Partial<GMBPost> = {
      languageCode: 'en-US',
      summary,
      callToAction: callToAction as any, // GMBCallToAction type mismatch - API accepts this structure
      media: mediaUrls?.map(url => ({
        mediaFormat: 'PHOTO',
        sourceUrl: url,
      })),
    };

    return this.createPost(locationName, 'UPDATE', post);
  }

  /**
   * Create an OFFER post
   */
  async createOfferPost(
    locationName: string,
    summary: string,
    offerDetails: {
      couponCode?: string;
      redeemOnlineUrl?: string;
      termsConditions?: string;
      startDate: Date;
      endDate: Date;
    },
    mediaUrls?: string[]
  ): Promise<GMBCreatePostResponse> {
    const post: Partial<GMBPost> = {
      languageCode: 'en-US',
      summary,
      media: mediaUrls?.map(url => ({
        mediaFormat: 'PHOTO',
        sourceUrl: url,
      })),
      // Note: Offer structure depends on API version
    };

    return this.createPost(locationName, 'OFFER', post);
  }

  /**
   * Create an EVENT post
   */
  async createEventPost(
    locationName: string,
    eventTitle: string,
    summary: string,
    eventDetails: {
      startDate: Date;
      endDate: Date;
      startTime?: string;
      endTime?: string;
    },
    mediaUrls?: string[]
  ): Promise<GMBCreatePostResponse> {
    const post: Partial<GMBPost> = {
      languageCode: 'en-US',
      summary,
      media: mediaUrls?.map(url => ({
        mediaFormat: 'PHOTO',
        sourceUrl: url,
      })),
      // Note: Event structure depends on API version
    };

    return this.createPost(locationName, 'EVENT', post);
  }

  /**
   * Upload media to GMB
   */
  async uploadMedia(
    locationName: string,
    mediaUrl: string,
    category: 'PROFILE' | 'LOGO' | 'COVER' | 'ADDITIONAL' = 'ADDITIONAL'
  ): Promise<GMBMedia> {
    try {
      const businessInfo = google.mybusinessbusinessinformation({
        version: 'v1',
        auth: this.oauth2Client,
      });

      // Note: Media upload implementation depends on API version
      // This is a placeholder

      // Mock implementation for media upload
      console.warn('[GMBService] Media upload not implemented - returning mock response');
      return {
        mediaFormat: 'PHOTO',
        sourceUrl: 'https://example.com/mock-media.jpg',
        mediaId: `mock-media-${Date.now()}`
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete a post
   */
  async deletePost(postName: string): Promise<void> {
    try {
      // Implementation depends on API version
      // Mock implementation for post deletion
      console.warn('[GMBService] Post deletion not implemented - mock success');
      return;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get post insights (views, clicks, etc.)
   */
  async getPostInsights(postName: string): Promise<any> {
    try {
      // Use Business Profile Performance API for insights
      // Mock implementation for post insights
      console.warn('[GMBService] Post insights not implemented - returning mock data');

      const startTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const endTime = new Date().toISOString();

      return {
        views: Math.floor(Math.random() * 1000) + 100,
        clicks: Math.floor(Math.random() * 100) + 10,
        callsToAction: Math.floor(Math.random() * 20) + 1,
        period: {
          startTime: startTime,
          endTime: endTime
        }
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Disconnect GMB connection
   */
  async disconnect(userId: string): Promise<void> {
    try {
      await supabase
        .from('gmb_connections')
        .update({
          status: 'disconnected',
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      // Revoke token with Google
      if (this.oauth2Client.credentials.access_token) {
        await this.oauth2Client.revokeCredentials();
      }
    } catch (error) {
      console.error('Error disconnecting GMB:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Save connection to database
   */
  private async saveConnection(
    userId: string,
    account: GMBAccount,
    tokens: GMBAuthTokens,
    locations: GMBLocation[]
  ): Promise<GMBConnection> {
    const expiryDate = tokens.expiry_date
      ? new Date(tokens.expiry_date)
      : new Date(Date.now() + 3600 * 1000);

    const locationsSummary = locations.map(loc => ({
      location_id: this.extractLocationId(loc.name),
      location_name: loc.locationName,
      address: this.formatAddress(loc.address),
      is_verified: loc.locationState?.isVerified || false,
      is_enabled_for_posting: loc.locationState?.canUpdate || false,
    }));

    const { data, error } = await supabase
      .from('gmb_connections')
      .upsert({
        user_id: userId,
        account_id: this.extractAccountId(account.name),
        account_name: account.accountName,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expiry: expiryDate.toISOString(),
        connected_at: new Date().toISOString(),
        last_synced: new Date().toISOString(),
        status: 'active',
        locations: locationsSummary,
      })
      .select()
      .single();

    if (error) {
      throw this.createError('API_ERROR', `Failed to save connection: ${error.message}`, 500);
    }

    return data as GMBConnection;
  }

  /**
   * Helper: Extract account ID from resource name
   */
  private extractAccountId(resourceName: string): string {
    // Resource name format: accounts/{account_id}
    return resourceName.split('/')[1];
  }

  /**
   * Helper: Extract location ID from resource name
   */
  private extractLocationId(resourceName: string): string {
    // Resource name format: accounts/{account_id}/locations/{location_id}
    return resourceName.split('/')[3];
  }

  /**
   * Helper: Format address for display
   */
  private formatAddress(address: any): string {
    if (!address) return '';
    const parts = [
      ...(address.addressLines || []),
      address.locality,
      address.administrativeArea,
      address.postalCode,
    ].filter(Boolean);
    return parts.join(', ');
  }

  /**
   * Create typed error
   */
  private createError(
    code: GMBServiceError['code'],
    message: string,
    statusCode?: number
  ): GMBServiceError {
    const error = new Error(message) as GMBServiceError;
    error.code = code;
    error.statusCode = statusCode;
    return error;
  }

  /**
   * Handle and transform errors
   */
  private handleError(error: any): GMBServiceError {
    console.error('GMB Service Error:', error);

    if (error.code) {
      // Already a GMBServiceError
      return error as GMBServiceError;
    }

    // Transform Google API errors
    if (error.response?.data?.error) {
      const gError = error.response.data.error;
      let code: GMBServiceError['code'] = 'API_ERROR';

      if (gError.code === 401 || gError.code === 403) {
        code = 'AUTH_ERROR';
      } else if (gError.code === 404) {
        code = 'NOT_FOUND';
      } else if (gError.code === 429) {
        code = 'QUOTA_ERROR';
      }

      return this.createError(code, gError.message || 'GMB API error', gError.code);
    }

    // Generic error
    return this.createError('API_ERROR', error.message || 'Unknown GMB error', 500);
  }

  /**
   * Retry logic wrapper
   */
  private async withRetry<T>(
    fn: () => Promise<T>,
    retries: number = this.config.maxRetries
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries > 0 && this.isRetryable(error)) {
        await this.sleep(this.config.retryDelay);
        return this.withRetry(fn, retries - 1);
      }
      throw error;
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryable(error: any): boolean {
    const retryableCodes = [429, 500, 502, 503, 504];
    return retryableCodes.includes(error.statusCode || error.response?.status);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
let gmbServiceInstance: GMBService | null = null;

export function getGMBService(): GMBService {
  if (!gmbServiceInstance) {
    gmbServiceInstance = new GMBService();
  }
  return gmbServiceInstance;
}

export default GMBService;
