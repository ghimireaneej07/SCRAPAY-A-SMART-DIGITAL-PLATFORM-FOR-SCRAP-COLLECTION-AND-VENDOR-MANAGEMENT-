import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { AppFlowProvider } from './contexts/AppFlowContext.jsx'
import { NotificationProvider } from './contexts/NotificationContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <NotificationProvider>
        <AppFlowProvider>
          <App />
        </AppFlowProvider>
      </NotificationProvider>
    </AuthProvider>
  </StrictMode>,
)
