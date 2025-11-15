/**
 * Admin Dashboard
 *
 * Admin-only page for managing users and viewing system data
 * Shows all users, search, and access to user sessions
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminService } from '@/services/admin.service';
import { AuthService } from '@/services/auth.service';
import type { UserProfile } from '@/services/auth.service';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    totalUsers: 0,
    newUsersToday: 0,
    newUsersThisWeek: 0,
    newUsersThisMonth: 0,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    // Filter users based on search query
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = users.filter(
        (user) =>
          user.email?.toLowerCase().includes(query) ||
          user.full_name?.toLowerCase().includes(query) ||
          user.business_name?.toLowerCase().includes(query)
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);

    try {
      // Check if user is admin
      const isAdmin = await AdminService.isAdmin();
      if (!isAdmin) {
        navigate('/');
        return;
      }

      // Load users and stats in parallel
      const [allUsers, userStats] = await Promise.all([
        AdminService.getAllUsers(),
        AdminService.getUserStats(),
      ]);

      setUsers(allUsers);
      setFilteredUsers(allUsers);
      setStats(userStats);
    } catch (err: any) {
      console.error('Failed to load admin dashboard:', err);
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleViewUser = (userId: string) => {
    navigate(`/admin/user/${userId}`);
  };

  const handleLogout = async () => {
    try {
      await AuthService.logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage users and monitor system activity
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Total Users</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">
              {stats.totalUsers}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">New Today</div>
            <div className="mt-2 text-3xl font-bold text-green-600">
              {stats.newUsersToday}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">This Week</div>
            <div className="mt-2 text-3xl font-bold text-blue-600">
              {stats.newUsersThisWeek}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">This Month</div>
            <div className="mt-2 text-3xl font-bold text-purple-600">
              {stats.newUsersThisMonth}
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">All Users</h2>
              <div className="flex-1 max-w-md ml-8">
                <input
                  type="text"
                  placeholder="Search by email, name, or business..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">
                {searchQuery ? 'No users found matching your search' : 'No users yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Business
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium">
                              {user.full_name?.charAt(0).toUpperCase() ||
                                user.email?.charAt(0).toUpperCase() ||
                                '?'}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.full_name || 'No name'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {user.business_name || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleViewUser(user.id)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          View Profile
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <button className="p-6 bg-white rounded-lg shadow hover:shadow-md transition text-left">
            <div className="text-2xl mb-2">📊</div>
            <div className="font-medium text-gray-900">View Analytics</div>
            <div className="text-sm text-gray-500 mt-1">
              System performance and usage metrics
            </div>
          </button>
          <button className="p-6 bg-white rounded-lg shadow hover:shadow-md transition text-left">
            <div className="text-2xl mb-2">📝</div>
            <div className="font-medium text-gray-900">Access Logs</div>
            <div className="text-sm text-gray-500 mt-1">
              View admin activity audit trail
            </div>
          </button>
          <button className="p-6 bg-white rounded-lg shadow hover:shadow-md transition text-left">
            <div className="text-2xl mb-2">⚙️</div>
            <div className="font-medium text-gray-900">System Settings</div>
            <div className="text-sm text-gray-500 mt-1">
              Configure platform settings
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
