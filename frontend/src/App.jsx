import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import HomePage from './pages/HomePage'
import RentalFormPage from './pages/RentalFormPage'
import MyRentalsPage from './pages/MyRentalsPage'
import AdminPage from './pages/AdminPage'
import AgentPage from './pages/AgentPage'

/**
 * Routes:
 * /           → Landing page (non connecté) ou redirect selon rôle
 * /catalogue  → Catalogue public des véhicules
 * /rent/:id   → Formulaire de réservation (CLIENT)
 * /my-rentals → Mes réservations (CLIENT)
 * /admin      → Dashboard ADMIN
 * /agent      → Dashboard AGENT
 */
export default function App({ keycloak }) {
  const isAuthenticated = keycloak?.authenticated
  const isAdmin = keycloak?.hasRealmRole?.('ADMIN')
  const isAgent = keycloak?.hasRealmRole?.('AGENT')

  // After login: redirect each role to their dashboard
  const getDashboardRoute = () => {
    if (isAdmin) return '/admin'
    if (isAgent) return '/agent'
    return '/catalogue'
  }

  return (
    <BrowserRouter>
      <Navbar keycloak={keycloak} />
      <main>
        <Routes>

          {/* Root: landing for guests, dashboard redirect for logged-in */}
          <Route path="/" element={
            isAuthenticated
              ? <Navigate to={getDashboardRoute()} replace />
              : <LandingPage keycloak={keycloak} />
          } />

          {/* Public catalogue */}
          <Route path="/catalogue" element={<HomePage keycloak={keycloak} />} />

          {/* Client: rental form */}
          <Route path="/rent/:id" element={
            <ProtectedRoute keycloak={keycloak}>
              <RentalFormPage keycloak={keycloak} />
            </ProtectedRoute>
          } />

          {/* Client: my rentals */}
          <Route path="/my-rentals" element={
            <ProtectedRoute keycloak={keycloak}>
              <MyRentalsPage keycloak={keycloak} />
            </ProtectedRoute>
          } />

          {/* Admin dashboard */}
          <Route path="/admin" element={
            <ProtectedRoute keycloak={keycloak} requiredRole="ADMIN">
              <AdminPage keycloak={keycloak} />
            </ProtectedRoute>
          } />

          {/* Agent dashboard */}
          <Route path="/agent" element={
            <ProtectedRoute keycloak={keycloak} requiredRole="AGENT">
              <AgentPage keycloak={keycloak} />
            </ProtectedRoute>
          } />

          {/* 404 */}
          <Route path="*" element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h2 className="text-2xl font-bold text-gray-800">Page introuvable</h2>
                <a href="/" className="text-blue-600 hover:underline mt-4 block">Retour à l'accueil</a>
              </div>
            </div>
          } />

        </Routes>
      </main>
    </BrowserRouter>
  )
}
