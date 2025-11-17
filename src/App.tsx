import { Routes, Route } from 'react-router-dom'
import { BrandProvider } from './contexts/BrandContext'
import { SynapsePage } from './pages/SynapsePage'
import { OnboardingPageV5 } from './pages/OnboardingPageV5'
import { ContentCalendarPage } from './pages/ContentCalendarPage'
import { CampaignPage } from './pages/CampaignPage'
import { SocialPilotCallback } from './pages/SocialPilotCallback'
// import LoginPage from './pages/LoginPage'
// import SignUpPage from './pages/SignUpPage'
// import AdminDashboard from './pages/AdminDashboard'
// import UserSessionViewer from './pages/UserSessionViewer'
// import ProtectedRoute from './components/auth/ProtectedRoute'

// TODO: Uncomment auth routes when ready to enable authentication (Phase 0)

function App() {
  return (
    <BrandProvider>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* AUTHENTICATION DISABLED FOR NOW - Will be enabled in Phase 0 */}
          {/* <Route path="/login" element={<LoginPage />} /> */}
          {/* <Route path="/signup" element={<SignUpPage />} /> */}

          {/* Public Routes (temporarily - will be protected in Phase 0) */}
          {/* Week 7: New onboarding flow as default */}
          <Route path="/" element={<OnboardingPageV5 />} />
          <Route path="/onboarding" element={<OnboardingPageV5 />} />

          {/* Legacy routes */}
          <Route path="/synapse" element={<SynapsePage />} />
          <Route path="/synapse-old" element={<SynapsePage />} />
          <Route path="/campaign/new" element={<CampaignPage />} />
          <Route path="/content-calendar" element={<ContentCalendarPage />} />
          <Route path="/auth/socialpilot/callback" element={<SocialPilotCallback />} />

          {/* Admin Routes - Commented out until authentication is enabled */}
          {/* <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} /> */}
          {/* <Route path="/admin/user/:userId" element={<ProtectedRoute adminOnly><UserSessionViewer /></ProtectedRoute>} /> */}
        </Routes>
      </div>
    </BrandProvider>
  )
}

export default App
