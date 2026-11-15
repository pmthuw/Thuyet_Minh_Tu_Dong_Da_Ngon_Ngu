import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Admin from './admin/Admin.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {(location.pathname.startsWith('/admin') || import.meta.env.VITE_ADMIN_ONLY === 'true') ? <Admin /> : <App />}
  </StrictMode>,
)
