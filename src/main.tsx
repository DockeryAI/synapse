import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
// import { publishingAutomation } from './services/publishing-automation.service'

// Start publishing automation
// TODO: Uncomment after running publishing_queue migration
// publishingAutomation.start()

ReactDOM.createRoot(document.getElementById('root')!).render(
  // StrictMode temporarily disabled to prevent double-renders during development
  // <React.StrictMode>
    <BrowserRouter future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }}>
      <App />
    </BrowserRouter>
  // </React.StrictMode>
)
