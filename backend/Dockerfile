# Build stage
FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /app

# Copy pom.xml and download dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build
COPY src ./src
RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy the built jar from build stage
COPY --from=build /app/target/*.jar app.jar

# Expose port
EXPOSE 8080

# Run the application with optimized memory settings for 512MB container
ENTRYPOINT ["java", \
    "-Xmx384m", \
    "-Xms128m", \
    "-XX:MaxMetaspaceSize=128m", \
    "-XX:+UseSerialGC", \
    "-XX:+UseContainerSupport", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-Dspring.jpa.hibernate.ddl-auto=update", \
    "-jar", "app.jar"]
