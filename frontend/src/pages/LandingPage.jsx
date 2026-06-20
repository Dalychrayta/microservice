/**
 * Page d'accueil publique — visible avant connexion.
 * Présente la plateforme et invite l'utilisateur à se connecter.
 */
export default function LandingPage({ keycloak }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-700 to-blue-900 flex flex-col">

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
        <div className="text-8xl mb-6">🚗</div>
        <h1 className="text-5xl font-extrabold text-white mb-4">
          CarRent Platform
        </h1>
        <p className="text-blue-200 text-xl max-w-xl mb-10">
          La solution complète de gestion de location de véhicules.
          Réservez, gérez et suivez vos locations en temps réel.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => keycloak?.login()}
            className="bg-white text-blue-700 font-bold px-8 py-3 rounded-xl text-lg hover:bg-blue-50 transition-colors shadow-lg"
          >
            Se connecter
          </button>
          <a
            href="/catalogue"
            className="bg-blue-600 border-2 border-white text-white font-bold px-8 py-3 rounded-xl text-lg hover:bg-blue-500 transition-colors"
          >
            Voir le catalogue
          </a>
        </div>
      </div>

      {/* Role cards */}
      <div className="bg-white py-16 px-6">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
          Un espace dédié pour chaque rôle
        </h2>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">

          <div className="bg-blue-50 rounded-2xl p-8 text-center border border-blue-100">
            <div className="text-5xl mb-4">👤</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Client</h3>
            <p className="text-gray-500 text-sm">
              Parcourez le catalogue, réservez un véhicule et suivez l'état de vos réservations.
            </p>
            <div className="mt-4">
              <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
                CLIENT
              </span>
            </div>
          </div>

          <div className="bg-yellow-50 rounded-2xl p-8 text-center border border-yellow-100">
            <div className="text-5xl mb-4">🧑‍💼</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Agent</h3>
            <p className="text-gray-500 text-sm">
              Gérez les réservations en attente, confirmez ou annulez les demandes des clients.
            </p>
            <div className="mt-4">
              <span className="inline-block bg-yellow-100 text-yellow-700 text-xs font-semibold px-3 py-1 rounded-full">
                AGENT
              </span>
            </div>
          </div>

          <div className="bg-red-50 rounded-2xl p-8 text-center border border-red-100">
            <div className="text-5xl mb-4">🛠️</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Administrateur</h3>
            <p className="text-gray-500 text-sm">
              Gérez la flotte complète, supervisez toutes les réservations et les statistiques.
            </p>
            <div className="mt-4">
              <span className="inline-block bg-red-100 text-red-700 text-xs font-semibold px-3 py-1 rounded-full">
                ADMIN
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <div className="bg-blue-900 text-blue-300 text-center py-4 text-sm">
        © 2024 CarRent Platform — Application Web Distribuée
      </div>
    </div>
  )
}
