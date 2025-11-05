package com.example.backend.config;

import com.nimbusds.jose.JWSVerifier;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.SignedJWT;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;

/**
 * Hybrid JWT Decoder that handles both:
 * 1. Keycloak JWTs (validated using Keycloak's public key via NimbusJwtDecoder)
 * 2. Custom JWTs (validated using our secret key for customer authentication)
 */
@Slf4j
@Component
public class HybridJwtDecoder implements JwtDecoder {

    private final JwtDecoder keycloakJwtDecoder;
    private final String jwtSecret;

    public HybridJwtDecoder(
            @Value("${spring.security.oauth2.resourceserver.jwt.issuer-uri}") String issuerUri,
            @Value("${jwt.secret:your-256-bit-secret-key-change-this-in-production-minimum-32-characters}") String jwtSecret) {

        // Create Keycloak JWT decoder for admin/supplier JWTs
        this.keycloakJwtDecoder = JwtDecoders.fromIssuerLocation(issuerUri);
        this.jwtSecret = jwtSecret;

        log.info("Hybrid JWT Decoder initialized with Keycloak issuer: {}", issuerUri);
    }

    @Override
    public Jwt decode(String token) throws JwtException {
        try {
            // First, try to parse the JWT to determine its type
            SignedJWT signedJWT = SignedJWT.parse(token);
            String issuer = signedJWT.getJWTClaimsSet().getIssuer();

            // Check if this is a custom customer JWT
            if ("savefood-backend".equals(issuer)) {
                log.debug("Decoding custom JWT for customer authentication");
                return decodeCustomJwt(token);
            } else {
                // It's a Keycloak JWT - use Keycloak decoder
                log.debug("Decoding Keycloak JWT for admin/supplier authentication");
                return keycloakJwtDecoder.decode(token);
            }

        } catch (Exception e) {
            log.error("Failed to decode JWT token", e);
            throw new BadJwtException("Invalid JWT token", e);
        }
    }

    /**
     * Decode and validate custom JWT for customers
     */
    private Jwt decodeCustomJwt(String token) {
        try {
            // Parse the signed JWT
            SignedJWT signedJWT = SignedJWT.parse(token);

            // Verify signature
            JWSVerifier verifier = new MACVerifier(jwtSecret.getBytes());
            if (!signedJWT.verify(verifier)) {
                throw new BadJwtException("Invalid JWT signature");
            }

            // Get claims
            Map<String, Object> claims = signedJWT.getJWTClaimsSet().getClaims();

            // Check expiration
            Instant expiresAt = signedJWT.getJWTClaimsSet().getExpirationTime().toInstant();
            if (expiresAt.isBefore(Instant.now())) {
                throw new JwtException("JWT token has expired");
            }

            // Get issued at
            Instant issuedAt = signedJWT.getJWTClaimsSet().getIssueTime().toInstant();

            // Build Jwt object
            return new Jwt(
                    token,
                    issuedAt,
                    expiresAt,
                    signedJWT.getHeader().toJSONObject(),
                    claims
            );

        } catch (Exception e) {
            log.error("Failed to decode custom JWT", e);
            throw new BadJwtException("Failed to decode custom JWT", e);
        }
    }
}
