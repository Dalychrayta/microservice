import { useState, useEffect } from 'react'
import { getAllRentals, confirmRental, cancelRental } from '../api/rentalApi'

/**
 * Dashboard Agent.
 * L'agent peut voir toutes les réservations et les confirmer / annuler.
 * Il ne gère pas les véhicules (rôle ADMIN uniquement).
 */

const STATUS_CONFIG = {
  PENDING:   { label: 'En attente',  color: 'bg-yellow-100 text-yellow-800' },
  CONFIRMED: { label: 'Confirmée',   color: 'bg-green-100 text-green-800'  },
  CANCELLED: { label: 'Annulée',     color: 'bg-red-100 text-red-800'      },
  COMPLETED: { label: 'Terminée',    color: 'bg-gray-100 text-gray-600'    }
}

export default function AgentPage({ keycloak }) {
  const [rentals, setRentals] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')

  const username = keycloak?.tokenParsed?.preferred_username

  useEffect(() => { fetchRentals() }, [])

  const fetchRentals = async () => {
    try {
      const data = await getAllRentals()
      setRentals(data)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async (id) => {
    try { await confirmRental(id); fetchRentals() }
    catch { alert('Erreur lors de la confirmation.') }
  }

  const handleCancel = async (id) => {
    if (!confirm('Annuler cette réservation ?')) return
    try { await cancelRental(id); fetchRentals() }
    catch { alert('Erreur lors de l\'annulation.') }
  }

  const filtered = filter === 'ALL' ? rentals : rentals.filter(r => r.status === filter)
  const pending = rentals.filter(r => r.status === 'PENDING').length

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin text-5xl">⚙️</div>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🧑‍💼 Espace Agent</h1>
          <p className="text-gray-500 mt-1">Bienvenue, {username} — Gérez les réservations clients</p>
        </div>
        {pending > 0 && (
          <div className="bg-yellow-100 text-yellow-800 font-semibold px-5 py-2 rounded-xl">
            ⏳ {pending} réservation(s) en attente
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total',      value: rentals.length,                                   icon: '📋', color: 'bg-blue-50' },
          { label: 'En attente', value: rentals.filter(r => r.status === 'PENDING').length,  icon: '⏳', color: 'bg-yellow-50' },
          { label: 'Confirmées', value: rentals.filter(r => r.status === 'CONFIRMED').length, icon: '✅', color: 'bg-green-50' },
          { label: 'Annulées',   value: rentals.filter(r => r.status === 'CANCELLED').length, icon: '❌', color: 'bg-red-50' },
        ].map(s => (
          <div key={s.label} className={`${s.color} rounded-2xl p-5 text-center`}>
            <div className="text-3xl mb-1">{s.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-sm text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['ALL', 'PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === s
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {s === 'ALL' ? 'Toutes' : STATUS_CONFIG[s]?.label}
          </button>
        ))}
      </div>

      {/* Reservations table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['#', 'Véhicule', 'Client', 'Période', 'Total', 'Statut', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400">
                  Aucune réservation trouvée.
                </td>
              </tr>
            ) : filtered.map(r => {
              const status = STATUS_CONFIG[r.status] || STATUS_CONFIG.PENDING
              return (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">#{r.id}</td>
                  <td className="px-4 py-3 font-medium">{r.vehicleBrand} {r.vehicleModel}</td>
                  <td className="px-4 py-3 text-gray-600">{r.customerName}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{r.startDate} → {r.endDate}</td>
                  <td className="px-4 py-3 text-blue-600 font-semibold">{r.totalPrice?.toLocaleString()} DZD</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${status.color}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {r.status === 'PENDING' && (
                        <button
                          onClick={() => handleConfirm(r.id)}
                          className="text-xs bg-green-100 text-green-700 hover:bg-green-200 font-medium px-3 py-1 rounded-lg transition-colors"
                        >
                          ✅ Confirmer
                        </button>
                      )}
                      {['PENDING', 'CONFIRMED'].includes(r.status) && (
                        <button
                          onClick={() => handleCancel(r.id)}
                          className="text-xs bg-red-100 text-red-600 hover:bg-red-200 font-medium px-3 py-1 rounded-lg transition-colors"
                        >
                          ❌ Annuler
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
