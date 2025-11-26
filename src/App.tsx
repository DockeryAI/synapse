import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { BrandProvider } from './contexts/BrandContext'
import { LoadingSpinner } from './components/ui/LoadingSpinner'
import { AppLayout } from './components/layout/AppLayout'

// Lazy-loaded pages for code splitting
const SynapsePage = lazy(() => import('./pages/SynapsePage').then(m => ({ default: m.SynapsePage })))
const OnboardingPageV5 = lazy(() => import('./pages/OnboardingPageV5').then(m => ({ default: m.OnboardingPageV5 })))
const SessionManagerPage = lazy(() => import('./pages/SessionManagerPage').then(m => ({ default: m.SessionManagerPage })))
// Original working dashboard (V2 streaming architecture was broken)
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })))
const ContentCalendarPage = lazy(() => import('./pages/ContentCalendarPage').then(m => ({ default: m.ContentCalendarPage })))
const CampaignPage = lazy(() => import('./pages/CampaignPage').then(m => ({ default: m.CampaignPage })))
const SocialPilotCallback = lazy(() => import('./pages/SocialPilotCallback').then(m => ({ default: m.SocialPilotCallback })))

// TODO: Lazy load auth routes when ready to enable authentication (Phase 0)
// const LoginPage = lazy(() => import('./pages/LoginPage'))
// const SignUpPage = lazy(() => import('./pages/SignUpPage'))
// const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
// const UserSessionViewer = lazy(() => import('./pages/UserSessionViewer'))
// const ProtectedRoute = lazy(() => import('./components/auth/ProtectedRoute'))

function App() {
  return (
    <BrandProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Accessibility: Skip to main content link */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md focus:shadow-lg"
        >
          Skip to main content
        </a>

        <Suspense fallback={<LoadingSpinner />}>
          <main id="main-content" className="animate-fade-in">
            <Routes>
              {/* AUTHENTICATION DISABLED FOR NOW - Will be enabled in Phase 0 */}
              {/* <Route path="/login" element={<LoginPage />} /> */}
              {/* <Route path="/signup" element={<SignUpPage />} /> */}

              {/* Routes with sidebar navigation */}
              <Route element={<AppLayout />}>
                {/* Default route - Dashboard */}
                <Route path="/" element={<DashboardPage />} />

                {/* Dashboard / Command Center */}
                <Route path="/dashboard" element={<DashboardPage />} />

                {/* Session Management */}
                <Route path="/sessions" element={<SessionManagerPage />} />

                {/* Synapse Content Generation */}
                <Route path="/synapse" element={<SynapsePage />} />
                <Route path="/synapse-old" element={<SynapsePage />} />
                <Route path="/campaign/new" element={<CampaignPage />} />
                <Route path="/content-calendar" element={<ContentCalendarPage />} />

                {/* Admin Routes - Commented out until authentication is enabled */}
                {/* <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} /> */}
                {/* <Route path="/admin/user/:userId" element={<ProtectedRoute adminOnly><UserSessionViewer /></ProtectedRoute>} /> */}
              </Route>

              {/* Routes without sidebar (onboarding flow) */}
              <Route path="/onboarding" element={<OnboardingPageV5 />} />
              <Route path="/onboarding-v5" element={<OnboardingPageV5 />} />

              {/* OAuth callbacks */}
              <Route path="/auth/socialpilot/callback" element={<SocialPilotCallback />} />
            </Routes>
          </main>
        </Suspense>
      </div>
    </BrandProvider>
  )
}

export default App
