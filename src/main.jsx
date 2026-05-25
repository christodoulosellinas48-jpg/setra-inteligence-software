import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Hide the static splash screen as soon as React takes over
if (typeof window.__hideSplash === 'function') window.__hideSplash();

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)