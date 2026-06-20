# Étape 1 : Compilation avec Maven DANS Docker
# Pas besoin d'installer Maven sur ton PC
FROM maven:3.9.6-eclipse-temurin-17-alpine AS build
WORKDIR /app
# Copie pom.xml et télécharge les dépendances (mis en cache)
COPY pom.xml .
RUN mvn dependency:go-offline -q
# Copie le code source et compile
COPY src ./src
RUN mvn clean package -DskipTests -q

# Étape 2 : Image finale légère (sans Maven)
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar eureka-server.jar
EXPOSE 8761
ENTRYPOINT ["java", "-jar", "eureka-server.jar"]
