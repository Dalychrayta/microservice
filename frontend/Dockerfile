# Étape 1 : Build React avec Vite
FROM node:20-alpine AS build
WORKDIR /app

# Copie package.json et installe les dépendances
COPY package*.json .
RUN npm install

# Copie le code source et build
COPY . .
RUN npm run build
# Le résultat est dans /app/dist

# Étape 2 : Serveur Nginx léger pour servir les fichiers statiques
FROM nginx:alpine AS runtime

# Copie les fichiers buildés dans le répertoire Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Configuration Nginx pour React Router (Single Page Application)
# Sans ça, un refresh sur /admin renverrait une 404
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
