import { useNavigate } from 'react-router-dom'

/**
 * Carte d'un véhicule dans le catalogue.
 * Affiche les infos et un bouton "Réserver".
 * La disponibilité réelle est gérée par les dates dans le formulaire de réservation.
 */
export default function VehicleCard({ vehicle, isAuthenticated }) {
  const navigate = useNavigate()

  const categoryEmoji = {
    SUV: '🚙',
    Sedan: '🚘',
    Compact: '🚗',
    Sport: '🏎️',
    Électrique: '⚡'
  }

  const handleRent = () => {
    if (!isAuthenticated) {
      alert('Veuillez vous connecter pour réserver une voiture.')
      return
    }
    navigate(`/rent/${vehicle.id}`)
  }

  return (
    <div className="card overflow-hidden hover:-translate-y-1">
      {/* Image du véhicule */}
      <div className="relative h-48 bg-gradient-to-br from-blue-100 via-indigo-100 to-teal-100 flex items-center justify-center">
        <span className="text-6xl">{categoryEmoji[vehicle.category] || '🚗'}</span>

        {/* Badge réservation par dates */}
        <span className="absolute top-3 right-3 badge text-xs font-bold bg-blue-100 text-blue-800">
          📅 Réservable selon dates
        </span>
      </div>

      {/* Infos */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-lg font-bold text-gray-900 tracking-tight">
              {vehicle.brand} {vehicle.model}
            </h3>
            <p className="text-sm text-gray-500">{vehicle.year} • {vehicle.color}</p>
          </div>
          <span className="badge bg-indigo-100 text-indigo-800 text-xs">
            {vehicle.category}
          </span>
        </div>

        {/* Prix */}
        <div className="flex items-center justify-between mt-4">
          <div>
            <span className="text-2xl font-bold text-blue-600">
              {vehicle.pricePerDay.toLocaleString()}
            </span>
            <span className="text-gray-500 text-sm"> DZD/jour</span>
          </div>

          <button
            onClick={handleRent}
            className="btn-primary text-sm shadow-md"
          >
            Réserver
          </button>
        </div>
      </div>
    </div>
  )
}
