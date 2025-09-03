import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { AuthProvider } from './AuthProvider'
import MedicoEntry from './MedicoEntry'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <MedicoEntry />
    </AuthProvider>
  </React.StrictMode>,
)
