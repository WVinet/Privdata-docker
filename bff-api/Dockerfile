FROM eclipse-temurin:21-jdk-alpine

WORKDIR /app

COPY . .

RUN ./mvnw clean package -DskipTests

EXPOSE 8085

CMD ["java", "-jar", "target/bff-api-0.0.1-SNAPSHOT.jar"]