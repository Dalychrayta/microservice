import { useState, useEffect } from 'react'
import { getAllVehicles, createVehicle, deleteVehicle } from '../api/vehicleApi'
import { getAllRentals, confirmRental, cancelRental } from '../api/rentalApi'

/**
 * Dashboard Admin.
 * Deux onglets :
 * - Gestion de la flotte (véhicules)
 * - Gestion des réservations (toutes)
 */

const STATUS_CONFIG = {
  PENDING:   { label: 'En attente',  color: 'bg-yellow-100 text-yellow-800' },
  CONFIRMED: { label: 'Confirmée',   color: 'bg-green-100 text-green-800'  },
  CANCELLED: { label: 'Annulée',     color: 'bg-red-100 text-red-800'      },
  COMPLETED: { label: 'Terminée',    color: 'bg-gray-100 text-gray-600'    }
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('vehicles')
  const [vehicles, setVehicles] = useState([])
  const [rentals, setRentals] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)

  // Formulaire ajout véhicule
  const [newVehicle, setNewVehicle] = useState({
    brand: '', model: '', category: 'Sedan',
    color: '', year: 2023, licensePlate: '', pricePerDay: 0
  })

  useEffect(() => {
    Promise.all([getAllVehicles(), getAllRentals()])
      .then(([v, r]) => { setVehicles(v); setRentals(r) })
      .finally(() => setLoading(false))
  }, [])

  const refreshData = () => {
    Promise.all([getAllVehicles(), getAllRentals()])
      .then(([v, r]) => { setVehicles(v); setRentals(r) })
  }

  const handleAddVehicle = async (e) => {
    e.preventDefault()
    try {
      await createVehicle(newVehicle)
      setShowAddForm(false)
      setNewVehicle({ brand: '', model: '', category: 'Sedan', color: '', year: 2023, licensePlate: '', pricePerDay: 0 })
      refreshData()
    } catch (err) {
      alert('Erreur lors de l\'ajout du véhicule.')
    }
  }

  const handleDeleteVehicle = async (id) => {
    if (!confirm('Supprimer ce véhicule ?')) return
    try {
      await deleteVehicle(id)
      refreshData()
    } catch { alert('Erreur lors de la suppression.') }
  }

  const handleConfirmRental = async (id) => {
    try { await confirmRental(id); refreshData() }
    catch { alert('Erreur lors de la confirmation.') }
  }

  const handleCancelRental = async (id) => {
    if (!confirm('Annuler cette réservation ?')) return
    try {
      await cancelRental(id)
      setRentals(prev => prev.filter(r => r.id !== id))
    }
    catch { alert('Erreur lors de l\'annulation.') }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin text-5xl">⚙️</div>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">🛠️ Dashboard Admin</h1>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Véhicules total', value: vehicles.length, icon: '🚗' },
          { label: 'Disponibles', value: vehicles.filter(v => v.available).length, icon: '✅' },
          { label: 'Réservations', value: rentals.length, icon: '📋' },
          { label: 'En attente', value: rentals.filter(r => r.status === 'PENDING').length, icon: '⏳' }
        ].map(stat => (
          <div key={stat.label} className="card p-4 text-center">
            <div className="text-3xl mb-1">{stat.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Onglets */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('vehicles')}
          className={`px-5 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'vehicles'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          🚗 Flotte ({vehicles.length})
        </button>
        <button
          onClick={() => setActiveTab('rentals')}
          className={`px-5 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'rentals'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          📋 Réservations ({rentals.length})
        </button>
      </div>

      {/* ─── Onglet Véhicules ─── */}
      {activeTab === 'vehicles' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Gestion de la flotte</h2>
            <button onClick={() => setShowAddForm(!showAddForm)} className="btn-primary">
              + Ajouter un véhicule
            </button>
          </div>

          {/* Formulaire ajout */}
          {showAddForm && (
            <form onSubmit={handleAddVehicle} className="card p-5 mb-6 grid grid-cols-2 gap-4">
              {[
                { key: 'brand', label: 'Marque', type: 'text' },
                { key: 'model', label: 'Modèle', type: 'text' },
                { key: 'color', label: 'Couleur', type: 'text' },
                { key: 'licensePlate', label: 'Immatriculation', type: 'text' },
                { key: 'year', label: 'Année', type: 'number' },
                { key: 'pricePerDay', label: 'Prix/jour (DZD)', type: 'number' }
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                  <input
                    type={field.type}
                    value={newVehicle[field.key]}
                    onChange={e => setNewVehicle({ ...newVehicle, [field.key]: field.type === 'number' ? +e.target.value : e.target.value })}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
              <div className="col-span-2 flex gap-3 mt-2">
                <button type="submit" className="btn-primary">Ajouter</button>
                <button type="button" onClick={() => setShowAddForm(false)} className="btn-secondary">Annuler</button>
              </div>
            </form>
          )}

          {/* Tableau des véhicules */}
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['ID', 'Marque / Modèle', 'Catégorie', 'Année', 'Prix/jour', 'Statut', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {vehicles.map(v => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-400">#{v.id}</td>
                    <td className="px-4 py-3 font-medium">{v.brand} {v.model}</td>
                    <td className="px-4 py-3 text-gray-500">{v.category}</td>
                    <td className="px-4 py-3 text-gray-500">{v.year}</td>
                    <td className="px-4 py-3 text-blue-600 font-medium">{v.pricePerDay?.toLocaleString()} DZD</td>
                    <td className="px-4 py-3">
                      <span className={`badge text-xs ${v.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {v.available ? 'Disponible' : 'Loué'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDeleteVehicle(v.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Onglet Réservations ─── */}
      {activeTab === 'rentals' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Toutes les réservations</h2>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['ID', 'Véhicule', 'Client', 'Dates', 'Total', 'Statut', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rentals.map(r => {
                  const status = STATUS_CONFIG[r.status] || STATUS_CONFIG.PENDING
                  return (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-400">#{r.id}</td>
                      <td className="px-4 py-3 font-medium">{r.vehicleBrand} {r.vehicleModel}</td>
                      <td className="px-4 py-3 text-gray-500">{r.customerName}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{r.startDate} → {r.endDate}</td>
                      <td className="px-4 py-3 text-blue-600 font-medium">{r.totalPrice?.toLocaleString()} DZD</td>
                      <td className="px-4 py-3">
                        <span className={`badge text-xs ${status.color}`}>{status.label}</span>
                      </td>
                      <td className="px-4 py-3 flex gap-2">
                        {r.status === 'PENDING' && (
                          <button onClick={() => handleConfirmRental(r.id)} className="text-green-600 hover:text-green-800 text-xs font-medium">
                            Confirmer
                          </button>
                        )}
                        {['PENDING', 'CONFIRMED'].includes(r.status) && (
                          <button onClick={() => handleCancelRental(r.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">
                            Annuler
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
