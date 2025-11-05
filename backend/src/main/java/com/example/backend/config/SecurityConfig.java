package com.example.backend.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final HybridJwtDecoder hybridJwtDecoder;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> {})
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/api/auth/login",
                                "/api/auth/refresh",
                                "/api/auth/logout",
                                "/api/auth/customer/phone-auth/step1",
                                "/api/auth/customer/phone-auth/step2",
                                "/api/auth/register/**",
                                "/api/auth/forgot-password",
                                "/api/auth/verify-reset-otp",
                                "/api/auth/reset-password",
                                "/api/locations/**",
                                "/api/banners/active",
                                "/swagger-ui/**",
                                "/api/demo/shipping/**",
                                "/v3/api-docs/**",
                                "/api/mobile/**"
                        ).permitAll()

                        // Authenticated endpoints
                        .requestMatchers("/api/auth/me").authenticated()

                        // Customer-only endpoints
                        .requestMatchers("/api/addresses/**").hasRole("CUSTOMER")
                        .requestMatchers("/api/favorites/**").hasRole("CUSTOMER")

                        // Customer endpoints (accessible by customer and admins)
                        .requestMatchers("/api/customers/**").hasAnyRole("CUSTOMER", "SUPER_ADMIN", "MODERATOR", "STAFF")

                        // Supplier endpoints (accessible by supplier and admins)
                        .requestMatchers("/api/suppliers/**").hasAnyRole("SUPPLIER", "SUPER_ADMIN", "MODERATOR", "STAFF")

                        // Admin endpoints
                        .requestMatchers("/api/admins/**").hasAnyRole("SUPER_ADMIN", "MODERATOR", "STAFF")

                        // File storage endpoints (authenticated users)
                        .requestMatchers("/api/files/**").authenticated()

                        // Public customer-facing endpoints 
                        .requestMatchers("/api/products/**", "/api/categories/**", "/api/stores/public", "/api/stores/top-stores", "/api/stores/*/products","/api/stores/nearby").permitAll()

                        // Partner/Promotion endpoints (temporary permitAll for development)
                        .requestMatchers("/api/partners/**", "/api/promotions/**").permitAll()

                        // SMS testing endpoints (development only - should be removed in production)
                        .requestMatchers("/sms/**").permitAll()

                        // All other requests require authentication
                        .anyRequest().authenticated())

                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt
                                .decoder(hybridJwtDecoder)
                                .jwtAuthenticationConverter(new HybridJwtAuthenticationConverter())
                        )
                );

        return http.build();
    }
}
