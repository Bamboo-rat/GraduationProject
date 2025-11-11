# Use official Keycloak image
FROM quay.io/keycloak/keycloak:25.0.6 AS builder

# Enable health and metrics
ENV KC_HEALTH_ENABLED=true
ENV KC_METRICS_ENABLED=true

# Configure database vendor for build phase
ENV KC_DB=mysql

# Build Keycloak with MySQL support
RUN /opt/keycloak/bin/kc.sh build

# Final stage
FROM quay.io/keycloak/keycloak:25.0.6
COPY --from=builder /opt/keycloak/ /opt/keycloak/

# Set environment variables for runtime
ENV KC_DB=mysql
ENV KC_HEALTH_ENABLED=true
ENV KC_METRICS_ENABLED=true

# Start Keycloak in production mode
ENTRYPOINT ["/opt/keycloak/bin/kc.sh", "start", "--optimized"]
