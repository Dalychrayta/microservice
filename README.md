# 🚗 Car Rental Platform — Applications Web Distribuées

> Projet de rattrapage — Module Applications Web Distribuées  
> Architecture Microservices avec Spring Boot, .NET, React, Docker, Keycloak

---

## 📋 Table des matières

- [Architecture](#architecture)
- [Technologies utilisées](#technologies-utilisées)
- [Structure du projet](#structure-du-projet)
- [Prérequis](#prérequis)
- [Lancer le projet](#lancer-le-projet)
- [Utilisateurs de test](#utilisateurs-de-test)
- [Endpoints API](#endpoints-api)
- [Communication entre microservices](#communication-entre-microservices)
- [Sécurité Keycloak](#sécurité-keycloak)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│                   React + Keycloak.js                       │
│                    localhost:3000                           │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP + JWT Token
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    API GATEWAY                              │
│              Spring Cloud Gateway :8080                     │
│         Valide JWT Keycloak + Route les requêtes            │
└──────────┬──────────────────────────────┬───────────────────┘
           │ /api/rentals/**              │ /api/vehicles/**
           ▼                              ▼
┌──────────────────────┐     ┌───────────────────────────┐
│   RENTAL-SERVICE     │     │    VEHICLE-SERVICE        │
│  Spring Boot :8081   │     │      .NET 8 :8082         │
│  MySQL Database      │     │   PostgreSQL Database     │
└──────────┬───────────┘     └──────────────┬────────────┘
           │                                │
           │  Feign (sync) ────────────────►│
           │  RabbitMQ (async) ────────────►│
           │                                │
           └───────────────┬────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
  │   EUREKA    │  │   CONFIG    │  │  KEYCLOAK   │
  │   :8761     │  │   :8888     │  │   :8180     │
  │  Discovery  │  │   Server    │  │   OAuth2    │
  └─────────────┘  └─────────────┘  └─────────────┘
         │
  ┌─────────────┐  ┌─────────────┐
  │  RABBITMQ   │  │    MYSQL    │
  │   :5672     │  │   :3306     │
  │  Messaging  │  └─────────────┘
  └─────────────┘
  ┌─────────────┐
  │ POSTGRESQL  │
  │   :5432     │
  └─────────────┘
```

---

## Technologies utilisées

| Composant | Technologie | Port |
|---|---|---|
| Frontend | React 18 + Vite + TailwindCSS | 3000 |
| API Gateway | Spring Cloud Gateway | 8080 |
| MS1 - Rental | Spring Boot 3.2 + MySQL | 8081 |
| MS2 - Vehicle | .NET 8 + PostgreSQL | 8082 |
| Service Discovery | Netflix Eureka | 8761 |
| Config Server | Spring Cloud Config | 8888 |
| Authentification | Keycloak 24 | 8180 |
| Messagerie | RabbitMQ 3.13 | 5672 / 15672 |
| Conteneurisation | Docker + Docker Compose | — |

---

## Structure du projet

```
car-rental-platform/
│
├── 📁 eureka-server/          # Serveur de découverte Netflix Eureka
│   ├── src/
│   ├── pom.xml
│   └── Dockerfile
│
├── 📁 config-server/          # Serveur de configuration centralisée
│   ├── src/
│   │   └── resources/
│   │       └── config-repo/   # Fichiers de config de chaque MS
│   ├── pom.xml
│   └── Dockerfile
│
├── 📁 rental-service/         # MS1 : Spring Boot + MySQL
│   ├── src/
│   │   └── java/com/carrental/rental/
│   │       ├── entity/        # Entités JPA (table MySQL)
│   │       ├── repository/    # Accès base de données
│   │       ├── dto/           # Objets de transfert de données
│   │       ├── client/        # Feign Client (communication sync)
│   │       ├── messaging/     # RabbitMQ Publisher (communication async)
│   │       ├── service/       # Logique métier
│   │       ├── controller/    # Endpoints REST
│   │       └── config/        # Sécurité Spring Security + Keycloak
│   ├── pom.xml
│   └── Dockerfile
│
├── 📁 vehicle-service/        # MS2 : .NET 8 + PostgreSQL
│   ├── Controllers/           # Endpoints REST
│   ├── Models/                # Entités Entity Framework
│   ├── DTOs/                  # Objets de transfert de données
│   ├── Data/                  # DbContext (ORM)
│   ├── Services/              # Logique métier
│   ├── Messaging/             # RabbitMQ Consumer (communication async)
│   ├── Program.cs             # Point d'entrée + configuration
│   ├── appsettings.json
│   └── Dockerfile
│
├── 📁 gateway/                # API Gateway Spring Cloud
│   ├── src/
│   │   └── java/com/carrental/gateway/
│   │       ├── config/        # Sécurité WebFlux + CORS
│   │       ├── filter/        # GlobalFilter (log + JWT forwarding)
│   │       └── controller/    # Fallback Circuit Breaker
│   ├── pom.xml
│   └── Dockerfile
│
├── 📁 frontend/               # Interface React
│   ├── src/
│   │   ├── api/               # Appels HTTP (Axios + intercepteur JWT)
│   │   ├── components/        # Composants réutilisables
│   │   └── pages/             # Pages de l'application
│   ├── Dockerfile
│   └── nginx.conf
│
├── 📁 keycloak/
│   └── realm-export.json      # Config Keycloak (realm, rôles, clients, users)
│
├── docker-compose.yml         # Orchestration de tous les services
├── build-all.sh               # Script de build complet
├── .env                       # Variables d'environnement
└── README.md                  # Cette documentation
```

---

## Prérequis

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (version 24+)
- [Docker Compose](https://docs.docker.com/compose/) (inclus dans Docker Desktop)
- [Java 17+](https://adoptium.net/) + [Maven 3.9+](https://maven.apache.org/) (pour le build)
- [.NET SDK 8.0](https://dotnet.microsoft.com/download) (pour le build vehicle-service)
- [Node.js 20+](https://nodejs.org/) (pour le build frontend)

---

## Lancer le projet

### Option 1 — Script automatique (recommandé)

```bash
# Clone le projet
git clone https://github.com/<votre-username>/car-rental-platform.git
cd car-rental-platform

# Build et lancement complet
chmod +x build-all.sh
./build-all.sh

# Lancer tous les containers
docker-compose up -d
```

### Option 2 — Étape par étape

```bash
# 1. Build des projets Spring Boot
cd eureka-server  && mvn clean package -DskipTests && cd ..
cd config-server  && mvn clean package -DskipTests && cd ..
cd rental-service && mvn clean package -DskipTests && cd ..
cd gateway        && mvn clean package -DskipTests && cd ..

# 2. Build du vehicle-service .NET
cd vehicle-service && dotnet publish -c Release -o publish && cd ..

# 3. Build du frontend React
cd frontend && npm install && npm run build && cd ..

# 4. Lancer Docker Compose
docker-compose up -d --build

# 5. Voir les logs en temps réel
docker-compose logs -f
```

### Vérifier que tout fonctionne

```bash
# Statut de tous les containers
docker-compose ps

# Logs d'un service spécifique
docker-compose logs rental-service
docker-compose logs vehicle-service

# Arrêter tout
docker-compose down

# Arrêter et supprimer les volumes (reset complet)
docker-compose down -v
```

---

## Utilisateurs de test

| Username | Password | Rôle | Accès |
|---|---|---|---|
| `admin` | `admin123` | ADMIN | Tout (flotte, réservations, catalogue) |
| `client1` | `client123` | CLIENT | Catalogue + réservations personnelles |
| `agent1` | `agent123` | AGENT | Confirmer / annuler les réservations |

---

## Endpoints API

Tous les appels passent par la **Gateway** sur `http://localhost:8080`

### Vehicle Service — `/api/vehicles`

| Méthode | Endpoint | Accès | Description |
|---|---|---|---|
| GET | `/api/vehicles` | Public | Liste tous les véhicules |
| GET | `/api/vehicles/{id}` | Public | Détails d'un véhicule |
| POST | `/api/vehicles` | ADMIN | Créer un véhicule |
| PUT | `/api/vehicles/{id}` | ADMIN | Modifier un véhicule |
| PUT | `/api/vehicles/{id}/availability` | Authentifié | Changer la disponibilité |
| DELETE | `/api/vehicles/{id}` | ADMIN | Supprimer un véhicule |

### Rental Service — `/api/rentals`

| Méthode | Endpoint | Accès | Description |
|---|---|---|---|
| POST | `/api/rentals` | CLIENT | Créer une réservation |
| GET | `/api/rentals/my` | CLIENT | Mes réservations |
| GET | `/api/rentals` | ADMIN/AGENT | Toutes les réservations |
| GET | `/api/rentals/{id}` | Authentifié | Détails d'une réservation |
| PUT | `/api/rentals/{id}/confirm` | ADMIN/AGENT | Confirmer une réservation |
| PUT | `/api/rentals/{id}/cancel` | Authentifié | Annuler une réservation |

---

## Communication entre microservices

### Communication Synchrone — Feign Client

Utilisée quand **rental-service** a besoin d'une réponse immédiate de **vehicle-service**.

**Scénario 1 : Créer une réservation**
```
Client ──POST /api/rentals──► rental-service
                                    │
                                    │ Feign: GET /api/vehicles/{id}
                                    ▼
                              vehicle-service
                                    │ Retourne: disponibilité + prix
                                    ▼
                              rental-service calcule le prix total
                              et sauvegarde en MySQL
```

**Scénario 2 : Confirmer une réservation**
```
Admin ──PUT /api/rentals/{id}/confirm──► rental-service
                                              │
                                              │ Feign: GET /api/vehicles/{id}
                                              ▼
                                        vehicle-service (vérification)
```

### Communication Asynchrone — RabbitMQ

Utilisée quand **rental-service** notifie **vehicle-service** sans attendre de réponse.

**Scénario 1 : Confirmation de location**
```
rental-service confirme réservation
       │
       │ Publie dans: rental.exchange
       │ Routing key: rental.confirmed
       ▼
  RabbitMQ ──► rental-confirmed-queue
                       │
                       ▼
              vehicle-service (consumer)
              met available = false pour le véhicule loué
```

**Scénario 2 : Annulation de location**
```
rental-service annule réservation
       │
       │ Publie dans: rental.exchange
       │ Routing key: rental.cancelled
       ▼
  RabbitMQ ──► rental-cancelled-queue
                       │
                       ▼
              vehicle-service (consumer)
              remet available = true pour le véhicule
```

---

## Sécurité Keycloak

### Flux d'authentification

```
1. Utilisateur ouvre l'app (localhost:3000)
2. Clique "Se connecter"
3. Keycloak.js redirige vers Keycloak (localhost:8180)
4. Utilisateur entre ses credentials
5. Keycloak génère un token JWT et redirige vers l'app
6. Keycloak.js stocke le token
7. Chaque requête API envoie : Authorization: Bearer <token>
8. La Gateway valide le token avec la clé publique de Keycloak
9. Si valide → route vers le microservice
10. Le microservice vérifie les rôles avec @PreAuthorize
```

### Structure du token JWT Keycloak

```json
{
  "sub": "user-uuid",
  "preferred_username": "client1",
  "email": "client1@carrental.com",
  "realm_access": {
    "roles": ["CLIENT"]
  },
  "exp": 1234567890
}
```

### Rôles et permissions

| Rôle | Permissions |
|---|---|
| `CLIENT` | Voir catalogue, créer/annuler ses réservations |
| `AGENT` | Confirmer/annuler toutes les réservations |
| `ADMIN` | Tout : gestion flotte + toutes les réservations |

### Sécurité des microservices

- La Gateway valide les tokens JWT Keycloak et applique les règles globales de routage.
- `rental-service` valide aussi le JWT et protège ses méthodes avec `@PreAuthorize`.
- `vehicle-service` valide aussi le JWT côté .NET et convertit les rôles Keycloak depuis `realm_access.roles` vers les rôles ASP.NET, ce qui permet à `[Authorize(Roles = "ADMIN")]` de fonctionner.
- Les endpoints de catalogue véhicule restent publics, mais les opérations d'administration restent protégées.

---

## Interfaces disponibles

| Interface | URL | Credentials |
|---|---|---|
| 🌐 Frontend React | http://localhost:3000 | via Keycloak |
| 🔀 Eureka Dashboard | http://localhost:8761 | — |
| 🐰 RabbitMQ Management | http://localhost:15672 | guest / guest |
| 🔐 Keycloak Admin | http://localhost:8180 | admin / admin |
| 📚 **Swagger Centralisé (Gateway)** | **http://localhost:8080/swagger-ui.html** | — |
| 📚 Swagger rental-service (direct) | http://localhost:8081/swagger-ui.html | — |
| 📚 Swagger vehicle-service (direct) | http://localhost:8082/swagger | — |

---

## Valeurs ajoutées

- ✅ **Swagger centralisé** : documentation API sur chaque microservice
- ✅ **Circuit Breaker réel via Resilience4j** : fallback sur la Gateway si `rental-service` ou `vehicle-service` est indisponible
- ✅ **Health checks** : tous les services exposent `/actuator/health`
- ✅ **Docker multi-stage** : images légères (Alpine) pour la production
- ✅ **Seed data** : 5 véhicules pré-chargés au démarrage via Entity Framework
