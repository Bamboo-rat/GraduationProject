package com.example.backend.service.impl;

import com.example.backend.entity.Customer;
import com.example.backend.service.JwtTokenService;
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Implementation of JwtTokenService using Nimbus JOSE JWT library
 * Generates custom JWT tokens for customer authentication (phone + OTP based)
 */
@Slf4j
@Service
public class JwtTokenServiceImpl implements JwtTokenService {

    @Value("${jwt.secret:your-256-bit-secret-key-change-this-in-production-minimum-32-characters}")
    private String jwtSecret;

    @Value("${jwt.access-token-expiration:72000000}") // 20 hours in milliseconds
    private Long accessTokenExpiration;

    @Value("${jwt.refresh-token-expiration:604800000}") // 7 days in milliseconds
    private Long refreshTokenExpiration;

    private static final String ISSUER = "savefood-backend";
    private static final String TOKEN_TYPE_CLAIM = "token_type";
    private static final String USER_TYPE_CLAIM = "user_type";
    private static final String ROLES_CLAIM = "roles";

    @Override
    public String generateCustomerAccessToken(Customer customer) {
        log.info("Generating access token for customer: {}", customer.getUserId());
        return generateToken(customer, accessTokenExpiration, "access");
    }

    @Override
    public String generateCustomerRefreshToken(Customer customer) {
        log.info("Generating refresh token for customer: {}", customer.getUserId());
        return generateToken(customer, refreshTokenExpiration, "refresh");
    }

    /**
     * Generate JWT token with customer claims
     */
    private String generateToken(Customer customer, Long expiration, String tokenType) {
        try {
            Date now = new Date();
            Date expiryDate = new Date(now.getTime() + expiration);

            // Build JWT claims
            JWTClaimsSet.Builder claimsBuilder = new JWTClaimsSet.Builder()
                    .subject(customer.getUserId()) // Use userId as subject
                    .issuer(ISSUER)
                    .issueTime(now)
                    .expirationTime(expiryDate)
                    .claim("username", customer.getUsername())
                    .claim("phoneNumber", customer.getPhoneNumber())
                    .claim(USER_TYPE_CLAIM, "CUSTOMER")
                    .claim(TOKEN_TYPE_CLAIM, tokenType)
                    .claim(ROLES_CLAIM, List.of("CUSTOMER"));

            // Add optional claims
            if (customer.getEmail() != null) {
                claimsBuilder.claim("email", customer.getEmail());
            }
            if (customer.getFullName() != null) {
                claimsBuilder.claim("fullName", customer.getFullName());
            }
            if (customer.getAvatarUrl() != null) {
                claimsBuilder.claim("avatarUrl", customer.getAvatarUrl());
            }

            JWTClaimsSet claimsSet = claimsBuilder.build();

            // Create signed JWT
            SignedJWT signedJWT = new SignedJWT(
                    new JWSHeader(JWSAlgorithm.HS256),
                    claimsSet
            );

            // Sign the JWT
            JWSSigner signer = new MACSigner(jwtSecret.getBytes());
            signedJWT.sign(signer);

            String token = signedJWT.serialize();
            log.info("Generated {} token for customer: {}", tokenType, customer.getUserId());
            return token;

        } catch (Exception e) {
            log.error("Error generating JWT token for customer: {}", customer.getUserId(), e);
            throw new RuntimeException("Failed to generate JWT token", e);
        }
    }

    @Override
    public Map<String, Object> validateAndDecodeToken(String token) {
        try {
            // Parse and verify the token
            SignedJWT signedJWT = SignedJWT.parse(token);
            JWSVerifier verifier = new MACVerifier(jwtSecret.getBytes());

            if (!signedJWT.verify(verifier)) {
                throw new RuntimeException("Invalid token signature");
            }

            // Check expiration
            JWTClaimsSet claims = signedJWT.getJWTClaimsSet();
            Date expirationTime = claims.getExpirationTime();
            if (expirationTime.before(new Date())) {
                throw new RuntimeException("Token has expired");
            }

            // Convert claims to map
            Map<String, Object> claimsMap = new HashMap<>(claims.getClaims());
            log.info("Token validated successfully for user: {}", claims.getSubject());
            return claimsMap;

        } catch (Exception e) {
            log.error("Error validating token", e);
            throw new RuntimeException("Failed to validate token", e);
        }
    }

    @Override
    public String extractUserId(String token) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);
            return signedJWT.getJWTClaimsSet().getSubject();
        } catch (Exception e) {
            log.error("Error extracting user ID from token", e);
            throw new RuntimeException("Failed to extract user ID", e);
        }
    }

    @Override
    public boolean isTokenExpired(String token) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);
            Date expirationTime = signedJWT.getJWTClaimsSet().getExpirationTime();
            return expirationTime.before(new Date());
        } catch (Exception e) {
            log.error("Error checking token expiration", e);
            return true; // Treat as expired if we can't parse it
        }
    }
}
