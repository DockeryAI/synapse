/**
 * SocialPilot API Service
 * Complete integration for OAuth 2.0 and social media publishing automation
 */

import { supabase } from '@/lib/supabase';

export interface SocialPilotConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export type Platform =
  | 'facebook'
  | 'twitter'
  | 'linkedin'
  | 'instagram'
  | 'tiktok'
  | 'pinterest'
  | 'youtube';

export interface SocialAccount {
  id: string;
  platform: Platform;
  name: string;
  handle: string;
  avatar: string;
  connected: boolean;
}

export interface PostSchedule {
  accountIds: string[];
  content: string;
  scheduledTime: Date;
  media?: string[];
  hashtags?: string[];
}

export interface PostResponse {
  id: string;
  status: 'scheduled' | 'published' | 'failed';
  accountsPosted: number;
  accountsFailed: number;
  error?: string;
}

export interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

/**
 * SocialPilot API Service
 * Handles OAuth 2.0 authentication and post scheduling/management
 */
export class SocialPilotService {
  private config: SocialPilotConfig;
  private accessToken?: string;
  private refreshToken?: string;
  private readonly API_BASE_URL = 'https://api.socialpilot.co';
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second

  constructor(config: SocialPilotConfig) {
    this.config = config;
    this.loadTokens();
  }

  /**
   * Load tokens from localStorage on initialization
   */
  private async loadTokens(): Promise<void> {
    try {
      // Try to load from Supabase first
      const { data, error } = await supabase
        .from('socialpilot_connections')
        .select('access_token, refresh_token, expires_at')
        .single();

      if (!error && data) {
        this.accessToken = data.access_token;
        this.refreshToken = data.refresh_token;

        // Check if token is expired
        const expiresAt = new Date(data.expires_at);
        if (expiresAt < new Date()) {
          console.log('[SocialPilot] Token expired, refreshing...');
          await this.refreshAccessToken();
        }
      }
    } catch (error) {
      console.warn('[SocialPilot] Failed to load tokens:', error);
    }
  }

  //=============================================================================
  // OAuth 2.0 Methods
  //=============================================================================

  /**
   * Get authorization URL to start OAuth flow
   * User should be redirected to this URL
   */
  async getAuthorizationUrl(): Promise<string> {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: 'accounts:read posts:write analytics:read',
    });

    const authUrl = `${this.API_BASE_URL}/oauth/authorize?${params}`;
    console.log('[SocialPilot] Generated authorization URL');
    return authUrl;
  }

  /**
   * Exchange authorization code for access token
   * Called in the OAuth callback
   */
  async exchangeCodeForToken(code: string): Promise<void> {
    console.log('[SocialPilot] Exchanging code for token...');

    try {
      const response = await fetch(`${this.API_BASE_URL}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: this.config.redirectUri,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Token exchange failed: ${response.status} - ${errorText}`);
      }

      const data: TokenData = await response.json();
      this.accessToken = data.access_token;
      this.refreshToken = data.refresh_token;

      // Store tokens securely in Supabase
      await this.storeTokens(data);

      console.log('[SocialPilot] Successfully obtained access token');
    } catch (error) {
      console.error('[SocialPilot] Token exchange error:', error);
      throw error;
    }
  }

  /**
   * Refresh the access token using refresh token
   */
  async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available. Please re-authenticate.');
    }

    console.log('[SocialPilot] Refreshing access token...');

    try {
      const response = await fetch(`${this.API_BASE_URL}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          refresh_token: this.refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Token refresh failed: ${response.status} - ${errorText}`);
      }

      const data: TokenData = await response.json();
      this.accessToken = data.access_token;

      // Update refresh token if provided (some OAuth providers rotate refresh tokens)
      if (data.refresh_token) {
        this.refreshToken = data.refresh_token;
      }

      await this.storeTokens(data);

      console.log('[SocialPilot] Successfully refreshed access token');
    } catch (error) {
      console.error('[SocialPilot] Token refresh error:', error);
      throw error;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  /**
   * Disconnect by clearing tokens
   */
  async disconnect(): Promise<void> {
    this.accessToken = undefined;
    this.refreshToken = undefined;

    try {
      await supabase.from('socialpilot_connections').delete().eq('user_id', 'current');
      console.log('[SocialPilot] Disconnected successfully');
    } catch (error) {
      console.error('[SocialPilot] Disconnect error:', error);
    }
  }

  //=============================================================================
  // Account Management Methods
  //=============================================================================

  /**
   * Get list of connected social media accounts
   */
  async getAccounts(): Promise<SocialAccount[]> {
    console.log('[SocialPilot] Fetching connected accounts...');

    try {
      const response = await this.apiCall('GET', '/accounts');

      // Transform API response to our interface
      const accounts: SocialAccount[] = (response.accounts || []).map((acc: any) => ({
        id: acc.id,
        platform: this.normalizePlatform(acc.platform),
        name: acc.name || acc.username,
        handle: acc.username || acc.handle,
        avatar: acc.profile_image_url || acc.avatar || '',
        connected: acc.status === 'active',
      }));

      console.log(`[SocialPilot] Found ${accounts.length} connected accounts`);
      return accounts;
    } catch (error) {
      console.error('[SocialPilot] Failed to fetch accounts:', error);
      throw error;
    }
  }

  /**
   * Get specific account by ID
   */
  async getAccount(accountId: string): Promise<SocialAccount | null> {
    try {
      const accounts = await this.getAccounts();
      return accounts.find((acc) => acc.id === accountId) || null;
    } catch (error) {
      console.error('[SocialPilot] Failed to fetch account:', error);
      return null;
    }
  }

  //=============================================================================
  // Post Management Methods
  //=============================================================================

  /**
   * Schedule a post to be published later
   */
  async schedulePost(params: PostSchedule): Promise<PostResponse> {
    console.log('[SocialPilot] Scheduling post...', {
      accounts: params.accountIds.length,
      scheduledTime: params.scheduledTime,
    });

    try {
      const response = await this.apiCall('POST', '/posts/schedule', {
        account_ids: params.accountIds,
        text: params.content,
        scheduled_at: params.scheduledTime.toISOString(),
        media_urls: params.media || [],
        hashtags: params.hashtags || [],
      });

      const result: PostResponse = {
        id: response.id || response.post_id,
        status: response.status || 'scheduled',
        accountsPosted: response.accounts_posted || params.accountIds.length,
        accountsFailed: response.accounts_failed || 0,
        error: response.error,
      };

      console.log('[SocialPilot] Post scheduled successfully:', result.id);
      return result;
    } catch (error) {
      console.error('[SocialPilot] Failed to schedule post:', error);
      throw error;
    }
  }

  /**
   * Publish a post immediately
   */
  async publishPost(params: PostSchedule): Promise<PostResponse> {
    console.log('[SocialPilot] Publishing post immediately...');

    try {
      const response = await this.apiCall('POST', '/posts', {
        account_ids: params.accountIds,
        text: params.content,
        media_urls: params.media || [],
        hashtags: params.hashtags || [],
      });

      const result: PostResponse = {
        id: response.id || response.post_id,
        status: 'published',
        accountsPosted: response.accounts_posted || params.accountIds.length,
        accountsFailed: response.accounts_failed || 0,
        error: response.error,
      };

      console.log('[SocialPilot] Post published successfully:', result.id);
      return result;
    } catch (error) {
      console.error('[SocialPilot] Failed to publish post:', error);
      throw error;
    }
  }

  /**
   * Get post status by ID
   */
  async getPostStatus(postId: string): Promise<PostResponse> {
    console.log('[SocialPilot] Fetching post status:', postId);

    try {
      const response = await this.apiCall('GET', `/posts/${postId}`);

      return {
        id: response.id,
        status: response.status,
        accountsPosted: response.accounts_posted || 0,
        accountsFailed: response.accounts_failed || 0,
        error: response.error,
      };
    } catch (error) {
      console.error('[SocialPilot] Failed to fetch post status:', error);
      throw error;
    }
  }

  /**
   * Delete a scheduled post
   */
  async deletePost(postId: string): Promise<void> {
    console.log('[SocialPilot] Deleting post:', postId);

    try {
      await this.apiCall('DELETE', `/posts/${postId}`);
      console.log('[SocialPilot] Post deleted successfully');
    } catch (error) {
      console.error('[SocialPilot] Failed to delete post:', error);
      throw error;
    }
  }

  /**
   * Get post analytics
   */
  async getPostAnalytics(postId: string): Promise<any> {
    console.log('[SocialPilot] Fetching post analytics:', postId);

    try {
      const response = await this.apiCall('GET', `/posts/${postId}/analytics`);
      return response;
    } catch (error) {
      console.error('[SocialPilot] Failed to fetch analytics:', error);
      throw error;
    }
  }

  //=============================================================================
  // Helper Methods
  //=============================================================================

  /**
   * Make authenticated API call with retry logic
   */
  private async apiCall(
    method: string,
    endpoint: string,
    body?: any,
    retryCount = 0
  ): Promise<any> {
    if (!this.accessToken) {
      throw new Error('Not authenticated. Please call exchangeCodeForToken() first.');
    }

    const url = `${this.API_BASE_URL}${endpoint}`;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      // Handle 401 Unauthorized - token expired
      if (response.status === 401) {
        console.warn('[SocialPilot] Token expired (401), attempting refresh...');

        // Try to refresh token
        await this.refreshAccessToken();

        // Retry the request with new token
        if (retryCount < this.MAX_RETRIES) {
          return this.apiCall(method, endpoint, body, retryCount + 1);
        } else {
          throw new Error('Max retries exceeded after token refresh');
        }
      }

      // Handle rate limiting (429)
      if (response.status === 429) {
        if (retryCount < this.MAX_RETRIES) {
          const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10);
          const delay = retryAfter * 1000;

          console.warn(`[SocialPilot] Rate limited, retrying after ${retryAfter}s...`);
          await this.sleep(delay);
          return this.apiCall(method, endpoint, body, retryCount + 1);
        } else {
          throw new Error('Rate limit exceeded, max retries reached');
        }
      }

      // Handle other errors
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API call failed: ${response.status} - ${errorText}`);
      }

      // Return JSON response
      return await response.json();
    } catch (error) {
      console.error(`[SocialPilot] API call failed (${method} ${endpoint}):`, error);

      // Retry on network failures
      if (retryCount < this.MAX_RETRIES && this.isNetworkError(error)) {
        console.warn(`[SocialPilot] Network error, retrying (${retryCount + 1}/${this.MAX_RETRIES})...`);
        await this.sleep(this.RETRY_DELAY * (retryCount + 1));
        return this.apiCall(method, endpoint, body, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * Store tokens securely in Supabase
   */
  private async storeTokens(data: TokenData): Promise<void> {
    try {
      const expiresAt = new Date(Date.now() + data.expires_in * 1000);

      const { error } = await supabase.from('socialpilot_connections').upsert(
        {
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_at: expiresAt.toISOString(),
          token_type: data.token_type,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      );

      if (error) {
        console.error('[SocialPilot] Failed to store tokens:', error);
      } else {
        console.log('[SocialPilot] Tokens stored securely');
      }
    } catch (error) {
      console.error('[SocialPilot] Token storage error:', error);
    }
  }

  /**
   * Normalize platform names from API to our standard
   */
  private normalizePlatform(platform: string): Platform {
    const normalized = platform.toLowerCase();

    const platformMap: Record<string, Platform> = {
      fb: 'facebook',
      tw: 'twitter',
      li: 'linkedin',
      ig: 'instagram',
      tk: 'tiktok',
      pin: 'pinterest',
      yt: 'youtube',
    };

    return (platformMap[normalized] as Platform) || (normalized as Platform);
  }

  /**
   * Check if error is a network error
   */
  private isNetworkError(error: any): boolean {
    return (
      error instanceof TypeError ||
      error.message?.includes('fetch') ||
      error.message?.includes('network')
    );
  }

  /**
   * Sleep helper for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Export singleton instance factory
export function createSocialPilotService(): SocialPilotService {
  const config: SocialPilotConfig = {
    clientId: import.meta.env.VITE_SOCIALPILOT_CLIENT_ID || 'test_client_id',
    clientSecret: import.meta.env.VITE_SOCIALPILOT_CLIENT_SECRET || 'test_client_secret',
    redirectUri:
      import.meta.env.VITE_SOCIALPILOT_REDIRECT_URI ||
      'http://localhost:5173/auth/socialpilot/callback',
  };

  return new SocialPilotService(config);
}
