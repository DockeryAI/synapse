/**
 * User Session Viewer
 *
 * Admin-only page for viewing a specific user's complete session data
 * Shows profile, business data, campaigns, and all related information
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AdminService } from '@/services/admin.service';
import type { UserProfile } from '@/services/auth.service';
import type { BusinessProfile, Campaign } from '@/services/admin.service';

export default function UserSessionViewer() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    if (!userId) {
      navigate('/admin');
      return;
    }

    loadUserData();
  }, [userId]);

  const loadUserData = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      // Check if user is admin
      const isAdmin = await AdminService.isAdmin();
      if (!isAdmin) {
        navigate('/');
        return;
      }

      // Load all user data
      const data = await AdminService.getUserData(userId);
      setProfile(data.profile);
      setBusinessProfile(data.businessProfile);
      setCampaigns(data.campaigns);
    } catch (err: any) {
      console.error('Failed to load user data:', err);
      setError(err.message || 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading user session...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-8 bg-white rounded-lg shadow-lg">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">
            {error || 'User not found'}
          </p>
          <Link
            to="/admin"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Return to Admin Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <Link
                to="/admin"
                className="text-sm text-blue-600 hover:text-blue-700 mb-2 inline-block"
              >
                ← Back to Admin Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">
                User Session: {profile.full_name || profile.email}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Read-only view of user's complete profile and data
              </p>
            </div>
            <div className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm font-medium">
              🔒 Admin View Only
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Profile */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">User Profile</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Full Name
                </label>
                <div className="text-gray-900">{profile.full_name || '-'}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Email
                </label>
                <div className="text-gray-900">{profile.email}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Business Name
                </label>
                <div className="text-gray-900">{profile.business_name || '-'}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  User ID
                </label>
                <div className="text-gray-900 font-mono text-sm">{profile.id}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Account Created
                </label>
                <div className="text-gray-900">{formatDate(profile.created_at)}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Last Updated
                </label>
                <div className="text-gray-900">{formatDate(profile.updated_at)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Business Profile */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Business Profile</h2>
          </div>
          <div className="p-6">
            {businessProfile ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Business Name
                  </label>
                  <div className="text-gray-900">{businessProfile.business_name}</div>
                </div>
                {businessProfile.industry && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Industry
                    </label>
                    <div className="text-gray-900">{businessProfile.industry}</div>
                  </div>
                )}
                {businessProfile.location && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Location
                    </label>
                    <div className="text-gray-900">{businessProfile.location}</div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">
                    Full Profile Data
                  </label>
                  <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-xs">
                    {JSON.stringify(businessProfile, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No business profile created yet
              </div>
            )}
          </div>
        </div>

        {/* Campaigns */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Campaigns ({campaigns.length})
            </h2>
          </div>
          <div className="p-6">
            {campaigns.length > 0 ? (
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900">{campaign.name}</h3>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {campaign.status}
                      </span>
                    </div>
                    <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto mt-2">
                      {JSON.stringify(campaign, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No campaigns created yet
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex justify-between items-center">
          <Link
            to="/admin"
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
          >
            Return to Admin Dashboard
          </Link>
          <button
            onClick={loadUserData}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
}
