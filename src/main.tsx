import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { TurnosProvider } from './context/TurnosContext.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import { DisponibilidadProvider } from './context/DisponibilidadContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <DisponibilidadProvider>
        <TurnosProvider>
          <App />
        </TurnosProvider>
      </DisponibilidadProvider>
    </AuthProvider>
  </StrictMode>,
)
