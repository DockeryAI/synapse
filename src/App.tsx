import { Routes, Route } from 'react-router-dom'
import { BrandProvider } from './contexts/BrandContext'
import { SynapsePage } from './pages/SynapsePage'

function App() {
  return (
    <BrandProvider>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<SynapsePage />} />
          <Route path="/synapse" element={<SynapsePage />} />
        </Routes>
      </div>
    </BrandProvider>
  )
}

export default App
