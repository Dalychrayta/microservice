import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getVehicleById } from '../api/vehicleApi'
import { createRental } from '../api/rentalApi'

const WEEK_DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

const toLocalDate = (value) => {
  if (!value) return null
  const raw = typeof value === 'string' ? value.slice(0, 10) : value
  const [year, month, day] = String(raw).split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

const toIsoDate = (date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())

const eachDayInclusive = (start, end) => {
  const days = []
  const current = startOfDay(start)
  const last = startOfDay(end)
  while (current <= last) {
    days.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }
  return days
}

const getMonthMatrix = (anchorDate) => {
  const firstDay = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1)
  const startWeekday = (firstDay.getDay() + 6) % 7
  const gridStart = new Date(firstDay)
  gridStart.setDate(firstDay.getDate() - startWeekday)

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart)
    date.setDate(gridStart.getDate() + index)
    return date
  })
}

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
  const [reservedDates, setReservedDates] = useState([])  // Plages de dates réservées
  const [calendarMonth, setCalendarMonth] = useState(() => startOfDay(new Date()))
  const submitLock = useRef(false)

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

  const today = startOfDay(new Date())

  useEffect(() => {
    const fetchData = async () => {
      try {
        const vehicleData = await getVehicleById(id)
        setVehicle(vehicleData)

        // Récupère les dates réservées depuis vehicle-service
        const response = await fetch(`http://localhost:8080/api/vehicles/${id}/reserved-dates`)
        if (response.ok) {
          const dates = await response.json()
          setReservedDates(dates)  // [{ startDate: "2024-07-22", endDate: "2024-07-23" }, ...]
        }
      } catch (err) {
        console.error('Error:', err)
        setError('Impossible de charger les informations.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  const isDateReserved = (date) => {
    return reservedDates.some(range => {
      const rangeStart = toLocalDate(range.startDate)
      const rangeEnd = toLocalDate(range.endDate)
      if (!rangeStart || !rangeEnd) return false
      return startOfDay(date) >= startOfDay(rangeStart) && startOfDay(date) <= startOfDay(rangeEnd)
    })
  }

  const isDateInSelectedRange = (date) => {
    if (!form.startDate) return false
    const start = toLocalDate(form.startDate)
    if (!start) return false
    const end = form.endDate ? toLocalDate(form.endDate) : start
    return startOfDay(date) >= startOfDay(start) && startOfDay(date) <= startOfDay(end)
  }

  const hasReservedInside = (start, end) => {
    return eachDayInclusive(start, end).some(day => isDateReserved(day))
  }

  const handleCalendarDayClick = (date) => {
    const normalized = startOfDay(date)
    if (normalized < today || isDateReserved(normalized)) return

    const clickedIso = toIsoDate(normalized)
    setError(null)

    if (!form.startDate || form.endDate) {
      setForm(prev => ({ ...prev, startDate: clickedIso, endDate: '' }))
      return
    }

    const start = toLocalDate(form.startDate)
    if (!start) {
      setForm(prev => ({ ...prev, startDate: clickedIso, endDate: '' }))
      return
    }

    if (normalized < startOfDay(start)) {
      setForm(prev => ({ ...prev, startDate: clickedIso, endDate: '' }))
      return
    }

    if (hasReservedInside(start, normalized)) {
      setError('Cette période inclut des dates déjà réservées. Choisissez une autre plage.')
      return
    }

    setForm(prev => ({ ...prev, endDate: clickedIso }))
  }

  const renderMonth = (monthDate) => {
    const days = getMonthMatrix(monthDate)
    const monthLabel = monthDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

    return (
      <div className="border border-gray-200 rounded-xl p-3 bg-white">
        <h4 className="text-sm font-semibold text-gray-800 capitalize mb-2">{monthLabel}</h4>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-1">
          {WEEK_DAYS.map(day => (
            <span key={day}>{day}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            const inCurrentMonth = day.getMonth() === monthDate.getMonth()
            const isPast = startOfDay(day) < today
            const reserved = isDateReserved(day)
            const selected = isDateInSelectedRange(day)

            const className = [
              'h-9 rounded-md text-sm transition-colors',
              inCurrentMonth ? 'text-gray-800' : 'text-gray-300',
              isPast ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : '',
              reserved ? 'bg-red-100 text-red-700 cursor-not-allowed border border-red-200' : '',
              selected ? 'bg-blue-600 text-white font-semibold' : '',
              !isPast && !reserved && !selected ? 'hover:bg-blue-50 cursor-pointer' : ''
            ].join(' ')

            return (
              <button
                key={`${toIsoDate(day)}-${index}`}
                type="button"
                onClick={() => handleCalendarDayClick(day)}
                disabled={isPast || reserved}
                className={className}
                title={reserved ? 'Date déjà réservée' : ''}
              >
                {day.getDate()}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  /**
   * Vérifie s'il y a chevauchement entre deux plages de dates.
   */
  const hasOverlap = (newStart, newEnd, ranges) => {
    const start = new Date(newStart)
    const end = new Date(newEnd)

    return ranges.some(range => {
      const rangeStart = new Date(range.startDate)
      const rangeEnd = new Date(range.endDate)
      // Chevauchement si : start <= rangeEnd ET end >= rangeStart
      return start <= rangeEnd && end >= rangeStart
    })
  }

  /**
   * Formate une date au format "jj/mm/aaaa"
   */
  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitLock.current) return

    if (days <= 0) {
      setError('La date de fin doit être après la date de début.')
      return
    }

    // ✨ Vérifie s'il y a chevauchement avec les dates réservées
    if (hasOverlap(form.startDate, form.endDate, reservedDates)) {
      setError(
        `⚠️ La période ${formatDate(form.startDate)} au ${formatDate(form.endDate)} ` +
        `chevauche une réservation existante. Veuillez choisir une autre date.`
      )
      return
    }

    submitLock.current = true
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
      const payload = err.response?.data
      const backendMessage =
        (typeof payload === 'string' && payload) ||
        payload?.message ||
        payload?.error ||
        null

      setError(backendMessage || 'Erreur lors de la réservation.')
    } finally {
      setSubmitting(false)
      submitLock.current = false
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Calendrier de réservation
          </label>

          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => {
                const prev = new Date(calendarMonth)
                prev.setMonth(prev.getMonth() - 1)
                setCalendarMonth(startOfDay(prev))
              }}
              className="px-3 py-1 rounded-lg border border-gray-200 text-sm hover:bg-gray-50"
            >
              ← Mois précédent
            </button>
            <button
              type="button"
              onClick={() => {
                const next = new Date(calendarMonth)
                next.setMonth(next.getMonth() + 1)
                setCalendarMonth(startOfDay(next))
              }}
              className="px-3 py-1 rounded-lg border border-gray-200 text-sm hover:bg-gray-50"
            >
              Mois suivant →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {renderMonth(calendarMonth)}
            {renderMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
          </div>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
              <p className="text-xs text-gray-500">Date de début</p>
              <p className="font-semibold text-gray-800">
                {form.startDate ? formatDate(form.startDate) : 'Non sélectionnée'}
              </p>
            </div>
            <div className="border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
              <p className="text-xs text-gray-500">Date de fin</p>
              <p className="font-semibold text-gray-800">
                {form.endDate ? formatDate(form.endDate) : 'Non sélectionnée'}
              </p>
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-2">
            Sélection: cliquez une première date (début), puis une deuxième date (fin).
            Les dates réservées apparaissent en rouge et sont non sélectionnables.
          </p>
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
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm font-semibold">
            {error}
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
