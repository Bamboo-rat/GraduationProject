package com.example.backend.config;

import org.mockito.Mockito;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Test configuration to mock security beans and avoid Keycloak connection during tests
 */
@TestConfiguration
public class TestSecurityConfig {

    /**
     * Mock JwtDecoder to avoid connecting to Keycloak during tests
     */
    @Bean
    @Primary
    public JwtDecoder jwtDecoder() {
        JwtDecoder mockDecoder = Mockito.mock(JwtDecoder.class);
        
        // Return a valid JWT when decode is called
        Jwt mockJwt = new Jwt(
            "mock-token",
            Instant.now(),
            Instant.now().plusSeconds(7200),
            Map.of("alg", "HS256", "typ", "JWT"),
            createMockClaims()
        );
        
        Mockito.when(mockDecoder.decode(Mockito.anyString())).thenReturn(mockJwt);
        
        return mockDecoder;
    }
    
    private Map<String, Object> createMockClaims() {
        Map<String, Object> claims = new HashMap<>();
        claims.put("sub", "test-user-id");
        claims.put("iss", "savefood-backend");
        claims.put("username", "test-user");
        claims.put("user_type", "CUSTOMER");
        claims.put("roles", new String[]{"CUSTOMER"});
        return claims;
    }
}
