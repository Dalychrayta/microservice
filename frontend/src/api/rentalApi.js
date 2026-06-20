import axios from 'axios'
import keycloak from '../keycloak'

const rentalAxios = axios.create({
  baseURL: 'http://localhost:8080/api/rentals'
})

rentalAxios.interceptors.request.use(async config => {
  if (keycloak?.authenticated) {
    try {
      // Ensure token is ready/valid, especially just after login redirect.
      await keycloak.updateToken(30)
    } catch {
      // If refresh fails, backend will return 401 and caller handles it.
    }
  }

  if (keycloak?.token) {
    config.headers.Authorization = `Bearer ${keycloak.token}`
  }
  return config
})

rentalAxios.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      keycloak?.authenticated
    ) {
      originalRequest._retry = true
      await keycloak.updateToken(30)
      originalRequest.headers.Authorization = `Bearer ${keycloak.token}`
      return rentalAxios(originalRequest)
    }

    return Promise.reject(error)
  }
)

// ─── API Functions ───────────────────────────────────────────

/** Crée une nouvelle location */
export const createRental = (data) =>
  rentalAxios.post('', data).then(r => r.data)

/** Mes locations (client connecté) */
export const getMyRentals = () =>
  rentalAxios.get('/my').then(r => r.data)

/** Toutes les locations (ADMIN) */
export const getAllRentals = () =>
  rentalAxios.get('').then(r => r.data)

/** Détails d'une location */
export const getRentalById = (id) =>
  rentalAxios.get(`/${id}`).then(r => r.data)

/** Confirme une location (ADMIN/AGENT) */
export const confirmRental = (id) =>
  rentalAxios.put(`/${id}/confirm`).then(r => r.data)

/** Annule une location */
export const cancelRental = (id) =>
  rentalAxios.put(`/${id}/cancel`).then(r => r.data)
