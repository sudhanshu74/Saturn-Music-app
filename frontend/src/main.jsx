import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { AudioProvider } from './context/AudioContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx' 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider> 
        <AudioProvider>
          <App />
        </AudioProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)