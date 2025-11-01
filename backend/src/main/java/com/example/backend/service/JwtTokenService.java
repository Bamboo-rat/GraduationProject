package com.example.backend.service;

import com.example.backend.entity.Customer;

import java.util.Map;

/**
 * Service for generating custom JWT tokens for customers (OTP-based authentication)
 * Customers authenticate via phone + OTP, not username/password, so they don't need Keycloak
 */
public interface JwtTokenService {

    /**
     * Generate access token for customer (short-lived, e.g., 1 hour)
     *
     * @param customer Customer entity
     * @return JWT access token string
     */
    String generateCustomerAccessToken(Customer customer);

    /**
     * Generate refresh token for customer (long-lived, e.g., 7 days)
     *
     * @param customer Customer entity
     * @return JWT refresh token string
     */
    String generateCustomerRefreshToken(Customer customer);

    /**
     * Validate and decode token
     *
     * @param token JWT token string
     * @return Map of claims if valid
     * @throws Exception if token is invalid or expired
     */
    Map<String, Object> validateAndDecodeToken(String token);

    /**
     * Extract user ID from token
     *
     * @param token JWT token string
     * @return User ID (customerId)
     */
    String extractUserId(String token);

    /**
     * Check if token is expired
     *
     * @param token JWT token string
     * @return true if token is expired
     */
    boolean isTokenExpired(String token);
}
