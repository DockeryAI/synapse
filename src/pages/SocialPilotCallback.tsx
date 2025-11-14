/**
 * SocialPilotCallback Page
 * Handles OAuth callback from SocialPilot
 * Exchanges authorization code for access token
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';
import { createSocialPilotService } from '@/services/socialpilot.service';

type CallbackStatus = 'loading' | 'success' | 'error' | 'user_denied';

interface CallbackState {
  status: CallbackStatus;
  message?: string;
  errorDetails?: string;
}

export function SocialPilotCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [state, setState] = useState<CallbackState>({
    status: 'loading',
  });

  /**
   * Handle OAuth callback on mount
   */
  useEffect(() => {
    handleCallback();
  }, []);

  /**
   * Process OAuth callback
   */
  const handleCallback = async () => {
    console.log('[SocialPilotCallback] Processing OAuth callback...');

    // Get params from URL
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Handle user denial
    if (error === 'access_denied') {
      console.log('[SocialPilotCallback] User denied authorization');
      setState({
        status: 'user_denied',
        message: 'You cancelled the connection',
        errorDetails: errorDescription || 'Authorization was cancelled',
      });
      return;
    }

    // Handle other errors
    if (error) {
      console.error('[SocialPilotCallback] OAuth error:', error, errorDescription);
      setState({
        status: 'error',
        message: 'Authorization failed',
        errorDetails: errorDescription || error,
      });
      return;
    }

    // Validate code
    if (!code) {
      console.error('[SocialPilotCallback] No authorization code received');
      setState({
        status: 'error',
        message: 'Invalid callback',
        errorDetails: 'No authorization code received from SocialPilot',
      });
      return;
    }

    // Exchange code for token
    try {
      const service = createSocialPilotService();

      console.log('[SocialPilotCallback] Exchanging code for token...');
      await service.exchangeCodeForToken(code);

      console.log('[SocialPilotCallback] Successfully connected!');
      setState({
        status: 'success',
        message: 'Successfully connected to SocialPilot!',
      });

      // Redirect to content calendar after 2 seconds
      setTimeout(() => {
        console.log('[SocialPilotCallback] Redirecting to calendar...');
        navigate('/content-calendar');
      }, 2000);
    } catch (err) {
      console.error('[SocialPilotCallback] Token exchange failed:', err);

      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';

      setState({
        status: 'error',
        message: 'Failed to complete connection',
        errorDetails: errorMessage,
      });
    }
  };

  /**
   * Navigate back to calendar
   */
  const handleGoBack = () => {
    navigate('/content-calendar');
  };

  /**
   * Retry connection
   */
  const handleRetry = () => {
    setState({ status: 'loading' });
    handleCallback();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8">
        {/* Loading State */}
        {state.status === 'loading' && (
          <div className="text-center space-y-4">
            <Loader2 className="w-16 h-16 mx-auto text-blue-600 animate-spin" />

            <div>
              <h2 className="text-2xl font-bold mb-2">Connecting...</h2>
              <p className="text-muted-foreground">
                Please wait while we connect your SocialPilot account
              </p>
            </div>

            <div className="pt-4">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" />
                <div
                  className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                  style={{ animationDelay: '0.1s' }}
                />
                <div
                  className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Success State */}
        {state.status === 'success' && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-2 text-green-900">Successfully Connected!</h2>
              <p className="text-muted-foreground">{state.message}</p>
            </div>

            <Alert className="bg-green-50 border-green-200 text-left">
              <ExternalLink className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-900">
                Your SocialPilot account is now connected. You can now schedule posts to all your
                social media platforms.
              </AlertDescription>
            </Alert>

            <div className="pt-4">
              <p className="text-sm text-muted-foreground">Redirecting to calendar...</p>
            </div>
          </div>
        )}

        {/* User Denied State */}
        {state.status === 'user_denied' && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-orange-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-orange-600" />
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-2 text-orange-900">Connection Cancelled</h2>
              <p className="text-muted-foreground">{state.message}</p>
            </div>

            <Alert className="bg-orange-50 border-orange-200 text-left">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-900">
                You need to authorize access to SocialPilot to enable automated publishing.
              </AlertDescription>
            </Alert>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={handleGoBack} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>

              <Button onClick={handleRetry} className="flex-1">
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* Error State */}
        {state.status === 'error' && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-2 text-red-900">Connection Failed</h2>
              <p className="text-muted-foreground">{state.message}</p>
            </div>

            {state.errorDetails && (
              <Alert variant="destructive" className="text-left">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm font-mono break-all">
                  {state.errorDetails}
                </AlertDescription>
              </Alert>
            )}

            <div className="bg-gray-50 p-4 rounded-lg text-left text-sm space-y-2">
              <h4 className="font-semibold">Troubleshooting:</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Make sure you have a SocialPilot account</li>
                <li>Check that your API credentials are correct</li>
                <li>Verify your network connection</li>
                <li>Try again in a few moments</li>
              </ul>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={handleGoBack} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>

              <Button onClick={handleRetry} className="flex-1">
                Try Again
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
