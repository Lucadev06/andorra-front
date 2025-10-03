import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { TurnosProvider } from './context/TurnosContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TurnosProvider>
      <App />
    </TurnosProvider>
  </StrictMode>,
)
