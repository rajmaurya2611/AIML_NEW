import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index_marcom.css'
import App_marcom from './App_marcom.tsx'

const container = document.getElementById("root");
if (container) {
  createRoot(container).render(
  <StrictMode>
    <App_marcom />
  </StrictMode>,
)
}

