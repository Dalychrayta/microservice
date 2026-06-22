import { useState, useEffect } from 'react'
import VehicleCard from '../components/VehicleCard'
import { getAllVehicles } from '../api/vehicleApi'

/**
 * Page d'accueil : catalogue public des véhicules.
 * Accessible sans connexion.
 * Inclut des filtres par catégorie et disponibilité.
 */
export default function HomePage({ keycloak }) {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filtres
  const [categoryFilter, setCategoryFilter] = useState('')

  useEffect(() => {
    fetchVehicles()
  }, [categoryFilter])

  const fetchVehicles = async () => {
    try {
      setLoading(true)
      const params = {}
      if (categoryFilter) params.category = categoryFilter

      const data = await getAllVehicles(params)
      console.log('API response:', data)
      // Protection : s'assure que data est bien un tableau
      setVehicles(Array.isArray(data) ? data : [])
    } catch (err) {
      setError('Impossible de charger les véhicules.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const categories = ['Sedan', 'SUV', 'Compact', 'Sport', 'Électrique']

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          Trouvez votre voiture idéale 🚗
        </h1>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto">
          Choisissez parmi notre flotte de véhicules premium.
          Réservation simple, livraison rapide.
        </p>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-8 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">Catégorie :</span>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Toutes</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <span className="ml-auto text-sm text-gray-400">
          {vehicles.length} véhicule(s) trouvé(s)
        </span>
      </div>

      {/* États */}
      {loading && (
        <div className="text-center py-16">
          <div className="animate-spin text-5xl mb-4">⚙️</div>
          <p className="text-gray-400">Chargement des véhicules...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">⚠️</div>
          <p className="text-red-500">{error}</p>
          <button onClick={fetchVehicles} className="btn-primary mt-4">
            Réessayer
          </button>
        </div>
      )}

      {/* Grille de véhicules */}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {vehicles.map(vehicle => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              isAuthenticated={keycloak?.authenticated}
            />
          ))}

          {vehicles.length === 0 && (
            <div className="col-span-full text-center py-16">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-gray-400">Aucun véhicule trouvé avec ces filtres.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
