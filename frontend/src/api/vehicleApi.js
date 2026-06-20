import axios from 'axios'
import keycloak from '../keycloak'

const vehicleAxios = axios.create({
  baseURL: 'http://localhost:8080/api/vehicles'
})

// Only add token on requests that need auth (admin routes)
vehicleAxios.interceptors.request.use(async config => {
  const needsAuth = config.url && (
    config.url.includes('/admin') ||
    config.method !== 'get'
  )

  if (needsAuth && keycloak?.authenticated) {
    try {
      await keycloak.updateToken(30)
    } catch {
      // Let request continue; backend auth response is handled by caller.
    }
  }

  if (needsAuth && keycloak?.token) {
    config.headers.Authorization = `Bearer ${keycloak.token}`
  }
  return config
})

// ─── API Functions ───────────────────────────────────────────

/** Récupère tous les véhicules avec filtres optionnels */
export const getAllVehicles = (params = {}) =>
  vehicleAxios.get('', { params }).then(r => r.data)

/** Récupère un véhicule par son ID */
export const getVehicleById = (id) =>
  vehicleAxios.get(`/${id}`).then(r => r.data)

/** Crée un nouveau véhicule (ADMIN) */
export const createVehicle = (data) =>
  vehicleAxios.post('', data).then(r => r.data)

/** Met à jour un véhicule (ADMIN) */
export const updateVehicle = (id, data) =>
  vehicleAxios.put(`/${id}`, data).then(r => r.data)

/** Supprime un véhicule (ADMIN) */
export const deleteVehicle = (id) =>
  vehicleAxios.delete(`/${id}`).then(r => r.data)

/** Met à jour la disponibilité */
export const updateAvailability = (id, available) =>
  vehicleAxios.put(`/${id}/availability`, null, { params: { available } }).then(r => r.data)
