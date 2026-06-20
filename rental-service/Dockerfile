# Étape 1 : Compilation avec Maven DANS Docker
FROM maven:3.9.6-eclipse-temurin-17-alpine AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -q
COPY src ./src
RUN mvn clean package -DskipTests -q

# Étape 2 : Image finale légère
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar rental-service.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "rental-service.jar"]
