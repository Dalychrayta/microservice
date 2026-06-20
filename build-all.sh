#!/bin/bash
# ═══════════════════════════════════════════════════════
# Script de build complet du projet Car Rental Platform
# Tout est compilé DANS Docker — pas besoin de Maven/Node/.NET installés
# Usage : ./build-all.sh
# ═══════════════════════════════════════════════════════

echo "🚀 Build Car Rental Platform"
echo "══════════════════════════════"
echo "Docker va tout compiler automatiquement..."
echo ""

docker-compose build

echo ""
echo "✅ Build terminé !"
echo ""
echo "Pour démarrer le projet :"
echo "  docker-compose up -d"
echo ""
echo "URLs d'accès :"
echo "  Frontend  : http://localhost:3000"
echo "  Gateway   : http://localhost:8080"
echo "  Swagger   : http://localhost:8080/swagger-ui.html"
echo "  Eureka    : http://localhost:8761"
echo "  RabbitMQ  : http://localhost:15672  (guest/guest)"
echo "  Keycloak  : http://localhost:8180   (admin/admin)"
echo ""
echo "Utilisateurs de test :"
echo "  admin   / admin123  → rôle ADMIN"
echo "  client1 / client123 → rôle CLIENT"
echo "  agent1  / agent123  → rôle AGENT"
