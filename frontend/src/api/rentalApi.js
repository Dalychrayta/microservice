import axios from 'axios'
import keycloak from '../keycloak'

const rentalAxios = axios.create({
  baseURL: 'http://localhost:8080/api/rentals'
})

rentalAxios.interceptors.request.use(config => {
  if (keycloak?.token) {
    config.headers.Authorization = `Bearer ${keycloak.token}`
  }
  return config
})

rentalAxios.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401 && keycloak?.isTokenExpired()) {
      await keycloak.updateToken(30)
      error.config.headers.Authorization = `Bearer ${keycloak.token}`
      return rentalAxios(error.config)
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
