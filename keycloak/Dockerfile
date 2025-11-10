FROM quay.io/keycloak/keycloak:25.0

# Set environment variables
ENV KC_HTTP_ENABLED=true
ENV KC_HEALTH_ENABLED=true
ENV KC_METRICS_ENABLED=true

# Build optimized for production (optional, can use start-dev for simplicity)
# RUN /opt/keycloak/bin/kc.sh build

# Expose port (Render uses PORT env variable, default to 8080)
EXPOSE 8080

# Start Keycloak
# Using start-dev for easier setup, change to 'start' for production
ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
CMD ["start-dev", "--http-port=8080", "--hostname-strict=false"]
