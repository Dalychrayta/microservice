import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getVehicleById } from '../api/vehicleApi'
import { createRental } from '../api/rentalApi'

/**
 * Page de réservation d'un véhicule.
 * Accessible aux CLIENT connectés.
 *
 * Flux :
 * 1. Récupère les détails du véhicule depuis vehicle-service (via Gateway)
 * 2. Affiche le formulaire de réservation
 * 3. À la soumission → appelle rental-service pour créer la location
 * 4. rental-service appelle vehicle-service via Feign pour vérifier la dispo (SYNC)
 */
export default function RentalFormPage({ keycloak }) {
  const { id } = useParams()  // ID du véhicule depuis l'URL
  const navigate = useNavigate()

  const [vehicle, setVehicle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  // Données du formulaire
  const [form, setForm] = useState({
    startDate: '',
    endDate: '',
    customerName: keycloak?.tokenParsed?.preferred_username || ''
  })

  // Calcul du nombre de jours et du prix total
  const days = form.startDate && form.endDate
    ? Math.max(0, Math.ceil(
        (new Date(form.endDate) - new Date(form.startDate)) / (1000 * 60 * 60 * 24)
      ))
    : 0
  const totalPrice = vehicle ? days * vehicle.pricePerDay : 0

  useEffect(() => {
    getVehicleById(id)
      .then(data => setVehicle(data))
      .catch(() => setError('Véhicule introuvable.'))
      .finally(() => setLoading(false))
  }, [id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (days <= 0) {
      setError('La date de fin doit être après la date de début.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      await createRental({
        vehicleId: parseInt(id),
        customerName: form.customerName,
        startDate: form.startDate,
        endDate: form.endDate
      })
      setSuccess(true)
      setTimeout(() => navigate('/my-rentals'), 2000)
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la réservation.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin text-5xl">⚙️</div>
    </div>
  )

  if (success) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-green-600">Réservation créée !</h2>
        <p className="text-gray-500 mt-2">Redirection vers vos réservations...</p>
      </div>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <button
        onClick={() => navigate('/')}
        className="text-blue-600 hover:text-blue-800 mb-6 flex items-center gap-1"
      >
        ← Retour au catalogue
      </button>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Réserver un véhicule
      </h1>

      {/* Détails du véhicule */}
      {vehicle && (
        <div className="card p-5 mb-6 flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center text-3xl">
            🚗
          </div>
          <div>
            <h3 className="font-bold text-lg">{vehicle.brand} {vehicle.model}</h3>
            <p className="text-gray-500 text-sm">{vehicle.category} • {vehicle.year}</p>
            <p className="text-blue-600 font-semibold mt-1">
              {vehicle.pricePerDay.toLocaleString()} DZD / jour
            </p>
          </div>
        </div>
      )}

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="card p-6 space-y-5">

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Votre nom complet
          </label>
          <input
            type="text"
            value={form.customerName}
            onChange={e => setForm({ ...form, customerName: e.target.value })}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date de début
            </label>
            <input
              type="date"
              value={form.startDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => setForm({ ...form, startDate: e.target.value })}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date de fin
            </label>
            <input
              type="date"
              value={form.endDate}
              min={form.startDate || new Date().toISOString().split('T')[0]}
              onChange={e => setForm({ ...form, endDate: e.target.value })}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Résumé du prix */}
        {days > 0 && (
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Durée :</span>
              <span className="font-medium">{days} jour(s)</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Prix/jour :</span>
              <span className="font-medium">{vehicle?.pricePerDay.toLocaleString()} DZD</span>
            </div>
            <div className="flex justify-between font-bold text-blue-700 text-lg border-t border-blue-200 pt-2 mt-2">
              <span>Total :</span>
              <span>{totalPrice.toLocaleString()} DZD</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-sm">
            ⚠️ {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || days <= 0}
          className="btn-primary w-full py-3 text-base"
        >
          {submitting ? '⏳ Réservation en cours...' : '✅ Confirmer la réservation'}
        </button>
      </form>
    </div>
  )
}
