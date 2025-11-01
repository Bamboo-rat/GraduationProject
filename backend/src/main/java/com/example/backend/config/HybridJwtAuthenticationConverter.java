package com.example.backend.config;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Hybrid JWT Authentication Converter that handles both:
 * 1. Keycloak JWTs (for Admin/Supplier) - uses KeycloakRoleConverter
 * 2. Custom JWTs (for Customer) - extracts roles from "roles" claim
 */
public class HybridJwtAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    private final KeycloakRoleConverter keycloakRoleConverter = new KeycloakRoleConverter();
    private final JwtGrantedAuthoritiesConverter jwtGrantedAuthoritiesConverter = new JwtGrantedAuthoritiesConverter();

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        // Determine JWT type by checking claims
        Collection<GrantedAuthority> authorities;

        if (isCustomerJwt(jwt)) {
            // Custom JWT for customers - extract roles from "roles" claim
            authorities = extractCustomerAuthorities(jwt);
        } else {
            // Keycloak JWT for admin/supplier - use KeycloakRoleConverter
            authorities = keycloakRoleConverter.convert(jwt);
        }

        return new JwtAuthenticationToken(jwt, authorities);
    }

    /**
     * Check if JWT is a custom customer JWT (not from Keycloak)
     */
    private boolean isCustomerJwt(Jwt jwt) {
        // Custom JWTs have "user_type" claim set to "CUSTOMER" and issuer is "savefood-backend"
        String userType = jwt.getClaimAsString("user_type");
        String issuer = jwt.getClaimAsString("iss");

        return "CUSTOMER".equals(userType) && "savefood-backend".equals(issuer);
    }

    /**
     * Extract authorities from custom customer JWT
     */
    @SuppressWarnings("unchecked")
    private Collection<GrantedAuthority> extractCustomerAuthorities(Jwt jwt) {
        // Extract roles from "roles" claim
        List<String> roles = jwt.getClaim("roles");

        if (roles == null || roles.isEmpty()) {
            return List.of();
        }

        return roles.stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                .collect(Collectors.toList());
    }
}
