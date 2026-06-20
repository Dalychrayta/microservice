/**
 * Configuration Keycloak — instance partagée dans toute l'app.
 * Cette instance est initialisée dans main.jsx.
 * Elle est importée ici pour être utilisée dans les API files.
 */
import Keycloak from 'keycloak-js'

const keycloak = new Keycloak({
  url: 'http://localhost:8180',
  realm: 'car-rental',
  clientId: 'car-rental-frontend'
})

export default keycloak
