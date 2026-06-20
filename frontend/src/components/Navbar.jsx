import { Link } from 'react-router-dom'

export default function Navbar({ keycloak }) {
  const isAuthenticated = keycloak?.authenticated
  const username = keycloak?.tokenParsed?.preferred_username
  const isAdmin = keycloak?.hasRealmRole?.('ADMIN')
  const isAgent = keycloak?.hasRealmRole?.('AGENT')

  return (
    <nav className="bg-blue-700 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          <Link to={isAuthenticated ? (isAdmin ? '/admin' : isAgent ? '/agent' : '/catalogue') : '/'} className="flex items-center gap-2 text-xl font-bold">
            🚗 <span>CarRent</span>
          </Link>

          <div className="flex items-center gap-6">
            <Link to="/catalogue" className="hover:text-blue-200 transition-colors">
              Catalogue
            </Link>
            {isAuthenticated && !isAdmin && !isAgent && (
              <Link to="/my-rentals" className="hover:text-blue-200 transition-colors">
                Mes réservations
              </Link>
            )}
            {isAdmin && (
              <Link to="/admin" className="hover:text-blue-200 transition-colors">
                Dashboard Admin
              </Link>
            )}
            {isAgent && (
              <Link to="/agent" className="hover:text-blue-200 transition-colors">
                Dashboard Agent
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <span className={`text-xs px-2 py-1 rounded-full font-semibold
                  ${isAdmin ? 'bg-red-500' : isAgent ? 'bg-yellow-500' : 'bg-green-500'}`}>
                  {isAdmin ? 'ADMIN' : isAgent ? 'AGENT' : 'CLIENT'}
                </span>
                <span className="text-blue-200 text-sm">👤 {username}</span>
                <button
                  onClick={() => keycloak.logout({ redirectUri: window.location.origin })}
                  className="bg-white text-blue-700 hover:bg-blue-50 font-semibold py-1.5 px-4 rounded-lg text-sm transition-colors"
                >
                  Se déconnecter
                </button>
              </>
            ) : (
              <button
                onClick={() => keycloak?.login()}
                className="bg-white text-blue-700 hover:bg-blue-50 font-semibold py-1.5 px-4 rounded-lg text-sm transition-colors"
              >
                Se connecter
              </button>
            )}
          </div>

        </div>
      </div>
    </nav>
  )
}
