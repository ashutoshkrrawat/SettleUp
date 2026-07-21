import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { MockDataProvider } from './context/MockDataContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MockDataProvider>
      <App />
    </MockDataProvider>
  </StrictMode>,
)