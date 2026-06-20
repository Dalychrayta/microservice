# Étape 1 : Build (compilation du projet .NET)
# On utilise l'image SDK qui contient tous les outils de compilation
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copie le fichier projet et restaure les dépendances NuGet
COPY *.csproj .
RUN dotnet restore

# Copie tout le code source et compile
COPY . .
RUN dotnet publish -c Release -o /app/publish

# Étape 2 : Runtime (image finale légère)
# L'image runtime est beaucoup plus petite que l'image SDK
# car elle ne contient que ce qui est nécessaire pour exécuter l'app
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Copie uniquement les fichiers compilés depuis l'étape build
COPY --from=build /app/publish .

EXPOSE 8082

ENTRYPOINT ["dotnet", "vehicle-service.dll"]
