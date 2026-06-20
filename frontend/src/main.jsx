import { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import keycloak from './keycloak.js'

function Root() {
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    keycloak
      .init({ checkLoginIframe: false })
      .then(() => setInitialized(true))
      .catch(() => setInitialized(true))
  }, [])

  if (!initialized) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚗</div>
          <p style={{ color: '#9ca3af' }}>Chargement...</p>
        </div>
      </div>
    )
  }

  return <App keycloak={keycloak} />
}

ReactDOM.createRoot(document.getElementById('root')).render(<Root />)
