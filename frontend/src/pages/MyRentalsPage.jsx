import { useState, useEffect } from 'react'
import { getMyRentals, cancelRental } from '../api/rentalApi'

/**
 * Page "Mes réservations" pour le CLIENT connecté.
 * Affiche toutes ses locations avec leur statut.
 * Permet d'annuler une réservation PENDING.
 */

// Couleurs et labels pour chaque statut
const STATUS_CONFIG = {
  PENDING:   { label: 'En attente',  color: 'bg-yellow-100 text-yellow-800' },
  CONFIRMED: { label: 'Confirmée',   color: 'bg-green-100 text-green-800'  },
  CANCELLED: { label: 'Annulée',     color: 'bg-red-100 text-red-800'      },
  COMPLETED: { label: 'Terminée',    color: 'bg-gray-100 text-gray-600'    }
}

export default function MyRentalsPage() {
  const [rentals, setRentals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchRentals()
  }, [])

  const fetchRentals = async () => {
    try {
      const data = await getMyRentals()
      setRentals(data)
    } catch (err) {
      setError('Impossible de charger vos réservations.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (id) => {
    if (!confirm('Annuler cette réservation ?')) return
    try {
      await cancelRental(id)
      fetchRentals() // Rafraîchit la liste
    } catch (err) {
      alert('Erreur lors de l\'annulation.')
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin text-5xl">⚙️</div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Mes réservations</h1>
      <p className="text-gray-500 mb-8">{rentals.length} réservation(s) au total</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-4 mb-6">
          {error}
        </div>
      )}

      {rentals.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-gray-400">Vous n'avez pas encore de réservations.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {rentals.map(rental => {
            const status = STATUS_CONFIG[rental.status] || STATUS_CONFIG.PENDING

            return (
              <div key={rental.id} className="card p-5">
                <div className="flex items-start justify-between">
                  {/* Infos véhicule */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">
                      🚗
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">
                        {rental.vehicleBrand} {rental.vehicleModel}
                      </h3>
                      <p className="text-sm text-gray-500">
                        📅 {rental.startDate} → {rental.endDate}
                      </p>
                      <p className="text-sm text-blue-600 font-semibold mt-0.5">
                        {rental.totalPrice?.toLocaleString()} DZD
                      </p>
                    </div>
                  </div>

                  {/* Statut + actions */}
                  <div className="flex flex-col items-end gap-2">
                    <span className={`badge ${status.color} text-xs font-semibold px-3 py-1`}>
                      {status.label}
                    </span>

                    {rental.status === 'PENDING' && (
                      <button
                        onClick={() => handleCancel(rental.id)}
                        className="text-red-500 hover:text-red-700 text-sm font-medium"
                      >
                        Annuler
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
                  Réservation #{rental.id} • Créée le {new Date(rental.createdAt).toLocaleDateString('fr-FR')}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
