import { useEffect } from 'react'

/**
 * Route protégée : redirige vers Keycloak si non connecté.
 * Utilisé pour les pages qui nécessitent une authentification.
 *
 * Utilisation dans App.jsx :
 * <ProtectedRoute keycloak={keycloak}>
 *   <MyRentalsPage keycloak={keycloak} />
 * </ProtectedRoute>
 */
export default function ProtectedRoute({ keycloak, requiredRole, children }) {
  useEffect(() => {
    // Si pas connecté → redirection vers Keycloak
    if (keycloak && !keycloak.authenticated) {
      keycloak.login()
    }
  }, [keycloak])

  // Vérifie le rôle si spécifié
  if (requiredRole && keycloak?.authenticated && !keycloak.hasRealmRole(requiredRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Accès refusé</h2>
          <p className="text-gray-500">
            Vous n'avez pas les droits nécessaires pour accéder à cette page.
          </p>
        </div>
      </div>
    )
  }

  // Affiche un spinner pendant la vérification
  if (!keycloak?.authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⚙️</div>
          <p className="text-gray-500">Vérification de l'authentification...</p>
        </div>
      </div>
    )
  }

  return children
}
