# Worktree Task: User Authentication & Admin Access

**Feature ID:** `authentication-authorization`
**Branch:** `feature/authentication`
**Estimated Time:** ~~6 hours~~ → **1 hour remaining** (most code already written)
**Priority:** CRITICAL - **BUILD THIS FIRST BEFORE EVERYTHING**
**Dependencies:** None
**Worktree Path:** `../synapse-auth`
**Status:** 80% complete - code written, needs database migration + App.tsx uncommenting

---

## Context

**THIS IS THE FOUNDATION.** Nothing else works without user accounts. Every feature saves data per user. Without auth, there's no way to persist or secure data.

**What This Enables:**
- Users can sign up and create accounts
- Users can log in and return to their data anytime
- All UVP, products, campaigns saved to their account
- Login from any device, see your data
- Admin can access any user's session for support

**Admin Account:**
- Email: `admin@dockeryai.com`
- Password: `admin123`
- Can view all users and their data

---

## Prerequisites

- Supabase project already exists
- Supabase client installed (`@supabase/supabase-js`)
- React Router for protected routes

---

## Setup

```bash
cd /Users/byronhudson/Projects/Synapse
git worktree add ../synapse-auth feature/authentication
cd ../synapse-auth
npm install

# Should already have Supabase
# npm install @supabase/supabase-js (already installed)
npm install react-router-dom  # If not already installed
```

Check `.env`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## ⚠️ WORK ALREADY COMPLETED (Do Not Redo)

The following files have already been created and are ready to use:

**Database Migration:**
- ✅ `supabase/migrations/20251115000001_authentication_system.sql` - Complete migration with user_profiles, admin_access_log, RLS policies

**Services:**
- ✅ `src/services/auth.service.ts` - Complete auth service (signup, login, logout, password reset, session management)
- ✅ `src/services/admin.service.ts` - Complete admin service (user management, access logging, session viewing)

**UI Components:**
- ✅ `src/pages/LoginPage.tsx` - Complete login page with email/password
- ✅ `src/pages/SignUpPage.tsx` - Complete signup page with validation
- ✅ `src/pages/AdminDashboard.tsx` - Complete admin dashboard (user list, search, stats)
- ✅ `src/pages/UserSessionViewer.tsx` - Complete user session viewer for admin
- ✅ `src/components/auth/ProtectedRoute.tsx` - Complete protected route wrapper

**Status:** Code is written but DISABLED in App.tsx (commented out). Routes are not protected yet.

---

## Task Checklist (What Remains)

### Part 1: Database Setup & Admin User Creation (30 minutes)

- [ ] Apply database migration to Supabase
  ```bash
  # Option 1: Via Supabase Dashboard
  # - Go to Database → Migrations
  # - Copy contents of supabase/migrations/20251115000001_authentication_system.sql
  # - Run in SQL Editor

  # Option 2: Via Supabase CLI (if installed)
  supabase db push
  ```

- [ ] Create admin user in Supabase Dashboard
  - Go to Authentication → Users
  - Add user manually:
    - Email: `admin@dockeryai.com`
    - Password: `admin123`
    - Auto-confirm email
  - Note the UUID (user ID) for reference

---

### Part 2: Enable Authentication in App (5 minutes)

#### File: `src/App.tsx`

- [ ] Uncomment the authentication imports at the top:
  ```typescript
  import LoginPage from './pages/LoginPage'
  import SignUpPage from './pages/SignUpPage'
  import AdminDashboard from './pages/AdminDashboard'
  import UserSessionViewer from './pages/UserSessionViewer'
  import ProtectedRoute from './components/auth/ProtectedRoute'
  ```

- [ ] Uncomment the login/signup routes:
  ```typescript
  <Route path="/login" element={<LoginPage />} />
  <Route path="/signup" element={<SignUpPage />} />
  ```

- [ ] Wrap all existing routes in `<ProtectedRoute>`:
  ```typescript
  <Route path="/" element={<ProtectedRoute><SynapsePage /></ProtectedRoute>} />
  <Route path="/synapse" element={<ProtectedRoute><SynapsePage /></ProtectedRoute>} />
  <Route path="/content-calendar" element={<ProtectedRoute><ContentCalendarPage /></ProtectedRoute>} />
  <Route path="/mirror" element={<ProtectedRoute><MirrorPage /></ProtectedRoute>} />
  <Route path="/auth/socialpilot/callback" element={<ProtectedRoute><SocialPilotCallback /></ProtectedRoute>} />
  ```

- [ ] Uncomment admin routes:
  ```typescript
  <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
  <Route path="/admin/user/:userId" element={<ProtectedRoute adminOnly><UserSessionViewer /></ProtectedRoute>} />
  ```

---

### Part 3: Testing & Validation (15 minutes)

- [ ] Test sign up flow
  - Create new test account
  - Verify user_profile is created in database
  - Verify auto-login works
  - Check redirect to onboarding

- [ ] Test login flow
  - Login with test account
  - Verify session persistence (refresh page)
  - Check redirect to last page visited

- [ ] Test logout flow
  - Click logout
  - Verify redirect to /login
  - Verify can't access protected routes

- [ ] Test admin access
  - Login as admin@dockeryai.com
  - Access /admin dashboard
  - View all users
  - Click "View Profile" on a test user
  - Verify admin access is logged in database

- [ ] Test protection
  - Logout
  - Try to access / (should redirect to /login)
  - Try to access /admin as non-admin user (should show access denied)

- [ ] Verify RLS policies
  - Login as regular user
  - Create business profile
  - Create campaign
  - Verify user can only see their own data
  - Verify admin can see all data

---

## Database Schema Changes

**All tables that store user data MUST have:**
- `user_id uuid references auth.users(id)` column
- RLS policies for user access
- RLS policies for admin access

**Tables to update:**
- `business_profiles` - add user_id
- `products` - has business_profile_id (indirect)
- `services` - has business_profile_id (indirect)
- `campaigns` - add user_id
- `campaign_posts` - has campaign_id (indirect)
- `youtube_channels` - add user_id
- `intelligence_runs` - add user_id
- All other tables with user-specific data

---

## Type Definitions

```typescript
export interface User {
  id: string
  email: string
  created_at: Date
}

export interface UserProfile {
  id: string
  email: string
  full_name?: string
  business_name?: string
  created_at: Date
  updated_at: Date
}

export interface Session {
  access_token: string
  refresh_token: string
  user: User
  expires_at: number
}

export interface AdminAccessLog {
  id: string
  admin_id: string
  accessed_user_id: string
  action: string
  timestamp: Date
}
```

---

## Testing

```typescript
describe('Authentication', () => {
  it('allows user signup', async () => {
    const user = await AuthService.signUp('test@example.com', 'password123', 'Test User')
    expect(user.email).toBe('test@example.com')
  })

  it('allows user login', async () => {
    const session = await AuthService.login('test@example.com', 'password123')
    expect(session.user).toBeDefined()
  })

  it('protects routes when not logged in', () => {
    // Mock: not logged in
    render(<ProtectedRoute><Dashboard /></ProtectedRoute>)
    expect(window.location.pathname).toBe('/login')
  })

  it('allows admin to view all users', async () => {
    // Mock: logged in as admin
    const users = await AdminService.getAllUsers()
    expect(users.length).toBeGreaterThan(0)
  })

  it('logs admin access', async () => {
    await AdminService.getUserProfile('user-123')
    const logs = await supabase.from('admin_access_log').select('*')
    expect(logs.data.some(log => log.action === 'viewed_profile')).toBe(true)
  })
})
```

---

## Security Checklist

- [ ] All passwords hashed (Supabase handles this)
- [ ] RLS policies enabled on ALL tables
- [ ] Admin can access all data (via RLS policies)
- [ ] Users can ONLY access their own data
- [ ] Admin access is logged
- [ ] Session tokens refresh automatically
- [ ] Password requirements enforced
- [ ] Email verification enabled (optional but recommended)
- [ ] HTTPS only in production

---

## Completion Criteria

**Authentication:**
- [ ] Sign up flow working
- [ ] Login flow working
- [ ] Logout working
- [ ] Password reset working
- [ ] Sessions persist (7 days)
- [ ] Protected routes block unauthenticated users

**Admin:**
- [ ] Admin account created (admin@dockeryai.com / admin123)
- [ ] Admin can login
- [ ] Admin dashboard shows all users
- [ ] Admin can view any user's profile
- [ ] Admin can view any user's campaigns
- [ ] Admin access logged in database

**Database:**
- [ ] All tables have RLS policies
- [ ] Users can only see their own data
- [ ] Admin can see all data
- [ ] No data leaks between users

**UI:**
- [ ] Login page polished
- [ ] Sign up page polished
- [ ] Admin dashboard functional
- [ ] User session viewer working

**Overall:**
- [ ] No TypeScript errors
- [ ] All routes protected
- [ ] Tested with multiple users
- [ ] Admin access verified
- [ ] No security vulnerabilities

---

## Commit & Merge

```bash
git add .
git commit -m "feat: Add user authentication and admin access system

User Authentication:
- Sign up with email/password
- Login with session persistence (7 days)
- Logout functionality
- Password reset flow
- Email verification
- Protected routes (must be logged in)

Admin Access:
- Admin account: admin@dockeryai.com / admin123
- Admin dashboard to view all users
- View any user's profile, campaigns, data
- Admin access logging for audit trail
- User impersonation (read-only)

Database Security:
- Row Level Security (RLS) on all tables
- Users can only access their own data
- Admin can access all data
- user_id foreign keys on all user-specific tables

UI Components:
- Login page
- Sign up page
- Protected route wrapper
- Admin dashboard
- User session viewer

Implements authentication-authorization feature"

git push origin feature/authentication
cd /Users/byronhudson/Projects/Synapse
git merge --no-ff feature/authentication
git push origin main
git worktree remove ../synapse-auth
```

---

## CRITICAL NOTES

**⚠️ BUILD THIS FIRST ⚠️**

Everything else depends on this. Without authentication:
- Can't save UVP data per user
- Can't persist business profiles
- Can't associate campaigns with users
- Can't secure data

**After this is merged:**
- All subsequent features will use `user_id` to save data
- All database queries will respect RLS policies
- Admin can support users by viewing their sessions

**Admin Login:**
- Email: `admin@dockeryai.com`
- Password: `admin123`
- Change password in production!

---

*This is the foundation. Don't fuck it up or nothing else will work.*
