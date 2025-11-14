/**
 * SocialPilotSync Component
 * UI for connecting and managing SocialPilot accounts
 * Handles OAuth flow initiation and account display
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Youtube,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Loader2,
  XCircle,
  Plus,
  Trash2,
} from 'lucide-react';
import { createSocialPilotService, SocialAccount, Platform } from '@/services/socialpilot.service';

interface SocialPilotSyncProps {
  className?: string;
  onConnectionChange?: (connected: boolean) => void;
}

/**
 * Get platform icon component
 */
const getPlatformIcon = (platform: Platform, className = 'w-5 h-5') => {
  const icons: Record<Platform, React.ReactElement> = {
    facebook: <Facebook className={className} />,
    twitter: <Twitter className={className} />,
    linkedin: <Linkedin className={className} />,
    instagram: <Instagram className={className} />,
    youtube: <Youtube className={className} />,
    tiktok: <div className={className}>TT</div>,
    pinterest: <div className={className}>P</div>,
  };

  return icons[platform] || <div className={className}>?</div>;
};

/**
 * Get platform color
 */
const getPlatformColor = (platform: Platform): string => {
  const colors: Record<Platform, string> = {
    facebook: 'bg-blue-600',
    twitter: 'bg-sky-500',
    linkedin: 'bg-blue-700',
    instagram: 'bg-gradient-to-r from-purple-500 to-pink-500',
    youtube: 'bg-red-600',
    tiktok: 'bg-black',
    pinterest: 'bg-red-500',
  };

  return colors[platform] || 'bg-gray-500';
};

export function SocialPilotSync({ className, onConnectionChange }: SocialPilotSyncProps) {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const service = createSocialPilotService();

  /**
   * Load accounts on mount
   */
  useEffect(() => {
    loadAccounts();
  }, []);

  /**
   * Notify parent of connection changes
   */
  useEffect(() => {
    onConnectionChange?.(accounts.length > 0);
  }, [accounts, onConnectionChange]);

  /**
   * Load connected accounts from SocialPilot
   */
  const loadAccounts = async () => {
    if (!service.isAuthenticated()) {
      console.log('[SocialPilotSync] Not authenticated, skipping account load');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const fetchedAccounts = await service.getAccounts();
      setAccounts(fetchedAccounts);

      console.log(`[SocialPilotSync] Loaded ${fetchedAccounts.length} accounts`);
    } catch (err) {
      console.error('[SocialPilotSync] Failed to load accounts:', err);
      setError('Failed to load connected accounts. Please try reconnecting.');
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refresh accounts list
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAccounts();
    setRefreshing(false);
    setSuccess('Accounts refreshed successfully');
    setTimeout(() => setSuccess(null), 3000);
  };

  /**
   * Start OAuth connection flow
   */
  const handleConnect = async () => {
    try {
      setLoading(true);
      setError(null);

      const authUrl = await service.getAuthorizationUrl();

      console.log('[SocialPilotSync] Redirecting to OAuth:', authUrl);

      // Redirect to SocialPilot OAuth
      window.location.href = authUrl;
    } catch (err) {
      console.error('[SocialPilotSync] Failed to start authorization:', err);
      setError('Failed to start connection. Please try again.');
      setLoading(false);
    }
  };

  /**
   * Disconnect from SocialPilot
   */
  const handleDisconnect = async () => {
    if (!confirm('Disconnect from SocialPilot? You will need to reconnect to schedule posts.')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await service.disconnect();
      setAccounts([]);
      setSuccess('Disconnected successfully');

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('[SocialPilotSync] Failed to disconnect:', err);
      setError('Failed to disconnect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Render connection status badge
   */
  const renderConnectionStatus = () => {
    if (!service.isAuthenticated()) {
      return (
        <Badge variant="outline" className="bg-gray-50">
          <XCircle className="w-3 h-3 mr-1" />
          Not Connected
        </Badge>
      );
    }

    const connectedAccounts = accounts.filter((a) => a.connected).length;

    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        {connectedAccounts} Account{connectedAccounts !== 1 ? 's' : ''} Connected
      </Badge>
    );
  };

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ExternalLink className="w-6 h-6" />
            SocialPilot Integration
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Connect your social media accounts to enable automated publishing
          </p>
        </div>

        <div className="flex items-center gap-2">
          {renderConnectionStatus()}

          {service.isAuthenticated() && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Success Alert */}
      {success && (
        <Alert className="mb-4 bg-green-50 text-green-900 border-green-200">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      {loading && !refreshing ? (
        <Card className="p-12 text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading accounts...</p>
        </Card>
      ) : !service.isAuthenticated() ? (
        /* Not Connected State */
        <Card className="p-8 text-center">
          <div className="max-w-md mx-auto">
            <ExternalLink className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Connect to SocialPilot</h3>
            <p className="text-muted-foreground mb-6">
              Connect your SocialPilot account to automatically publish content to all your social media platforms.
            </p>

            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {['facebook', 'twitter', 'linkedin', 'instagram', 'youtube'].map((platform) => (
                <div
                  key={platform}
                  className={`p-2 rounded ${getPlatformColor(platform as Platform)} text-white`}
                >
                  {getPlatformIcon(platform as Platform, 'w-5 h-5')}
                </div>
              ))}
            </div>

            <Button onClick={handleConnect} size="lg" disabled={loading}>
              <Plus className="w-4 h-4 mr-2" />
              Connect SocialPilot Account
            </Button>

            <p className="text-xs text-muted-foreground mt-4">
              You'll be redirected to SocialPilot to authorize access
            </p>
          </div>
        </Card>
      ) : accounts.length === 0 ? (
        /* No Accounts Connected State */
        <Card className="p-8 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-orange-500" />
          <h3 className="text-xl font-semibold mb-2">No Social Accounts Found</h3>
          <p className="text-muted-foreground mb-6">
            You're connected to SocialPilot, but no social media accounts are linked.
            <br />
            Please add social accounts in SocialPilot first.
          </p>

          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh Accounts
            </Button>

            <Button variant="destructive" onClick={handleDisconnect}>
              <Trash2 className="w-4 h-4 mr-2" />
              Disconnect
            </Button>
          </div>
        </Card>
      ) : (
        /* Connected Accounts List */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Connected Accounts ({accounts.filter((a) => a.connected).length})
            </h3>

            <Button variant="destructive" size="sm" onClick={handleDisconnect}>
              <Trash2 className="w-4 h-4 mr-2" />
              Disconnect All
            </Button>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {accounts.map((account) => (
              <Card
                key={account.id}
                className={`p-4 ${account.connected ? 'border-green-200 bg-green-50/30' : 'border-gray-200 bg-gray-50/30'}`}
              >
                <div className="flex items-center gap-3">
                  {/* Platform Icon */}
                  <div
                    className={`p-3 rounded-lg ${getPlatformColor(account.platform)} text-white flex-shrink-0`}
                  >
                    {getPlatformIcon(account.platform, 'w-6 h-6')}
                  </div>

                  {/* Account Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold truncate">{account.name}</h4>
                      {account.connected ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground truncate">
                      @{account.handle} • {account.platform}
                    </p>
                  </div>

                  {/* Avatar */}
                  {account.avatar && (
                    <img
                      src={account.avatar}
                      alt={account.name}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    />
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* Platform Summary */}
          <Card className="p-4 bg-blue-50/30 border-blue-200">
            <h4 className="font-semibold mb-3 text-sm">Platform Summary</h4>
            <div className="flex flex-wrap gap-2">
              {['facebook', 'twitter', 'linkedin', 'instagram', 'youtube', 'tiktok'].map(
                (platform) => {
                  const count = accounts.filter(
                    (a) => a.platform === platform && a.connected
                  ).length;

                  return (
                    <Badge
                      key={platform}
                      variant={count > 0 ? 'default' : 'outline'}
                      className="capitalize"
                    >
                      {platform}: {count}
                    </Badge>
                  );
                }
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
