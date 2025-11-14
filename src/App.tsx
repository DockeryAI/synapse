import { Routes, Route } from 'react-router-dom'
import { BrandProvider } from './contexts/BrandContext'
import { SynapsePage } from './pages/SynapsePage'
import { ContentCalendarPage } from './pages/ContentCalendarPage'
import { SocialPilotCallback } from './pages/SocialPilotCallback'

function App() {
  return (
    <BrandProvider>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<SynapsePage />} />
          <Route path="/synapse" element={<SynapsePage />} />
          <Route path="/content-calendar" element={<ContentCalendarPage />} />
          <Route path="/auth/socialpilot/callback" element={<SocialPilotCallback />} />
        </Routes>
      </div>
    </BrandProvider>
  )
}

export default App
