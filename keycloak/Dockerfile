# Use official Keycloak image
FROM quay.io/keycloak/keycloak:25.0.6

# Set environment variables
# Use MySQL as the DB vendor so Keycloak loads the MySQL JDBC driver
ENV KC_DB=mysql
ENV KC_HEALTH_ENABLED=true
ENV KC_METRICS_ENABLED=true

# Copy realm configuration (optional, if you have one)
# COPY realm-export.json /opt/keycloak/data/import/

# Start Keycloak in production mode
ENTRYPOINT ["/opt/keycloak/bin/kc.sh", "start", "--optimized"]
