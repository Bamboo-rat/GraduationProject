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
    private final CustomAuthenticationEntryPoint customAuthenticationEntryPoint;

    @Bean
    public HybridJwtAuthenticationConverter jwtAuthenticationConverter() {
        return new HybridJwtAuthenticationConverter();
    }

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
                                "/api/mobile/**",
                                "/api/admin/fix-cod-wallets",
                                "/api/auth/customer/login/**",
                                "/ws/**" 
                        ).permitAll()

                        // Chat endpoints - require authentication (all roles)
                        .requestMatchers("/api/chat/**").authenticated()

                        // Authenticated endpoints
                        .requestMatchers("/api/auth/me").authenticated()

                        // Customer-only endpoints
                        .requestMatchers("/api/addresses/**").hasRole("CUSTOMER")
                        .requestMatchers("/api/favorites/**").hasRole("CUSTOMER")

                        // Customer endpoints (accessible by customer and admins)
                        .requestMatchers("/api/customers/**").hasAnyRole("CUSTOMER", "SUPER_ADMIN", "MODERATOR", "STAFF")

                        // Supplier endpoints (accessible by supplier and admins)
                        .requestMatchers("/api/suppliers/**").hasAnyRole("SUPPLIER", "SUPER_ADMIN", "MODERATOR", "STAFF")

                        // Order endpoints
                        .requestMatchers("/api/orders/checkout").hasRole("CUSTOMER")
                        .requestMatchers("/api/orders/my-orders").hasRole("CUSTOMER")
                        .requestMatchers("/api/orders/store/**").hasRole("SUPPLIER")
                        .requestMatchers("/api/orders/*/confirm", "/api/orders/*/prepare", "/api/orders/*/ship", "/api/orders/*/deliver").hasRole("SUPPLIER")
                        .requestMatchers("/api/orders/*/cancel").hasAnyRole("CUSTOMER", "SUPPLIER")
                        .requestMatchers("/api/orders/all").hasAnyRole("SUPER_ADMIN", "MODERATOR", "STAFF")
                        // Public access for order viewing (for 3rd party integrations like shipping partners)
                        .requestMatchers("/api/orders/**").permitAll()

                        // Admin endpoints
                        .requestMatchers("/api/admins/**").hasAnyRole("SUPER_ADMIN", "MODERATOR", "STAFF")

                        .requestMatchers("/api/files/**").permitAll()

                        // Public customer-facing endpoints 
                        .requestMatchers("/api/products/**", "/api/categories/**", "/api/stores/public", "/api/stores/top-stores", "/api/stores/*/products","/api/stores/nearby").permitAll()
                        
                        // Review endpoints (public read access)
                        .requestMatchers("/api/reviews/**").permitAll()

                        // Partner/Promotion endpoints (temporary permitAll for development)
                        .requestMatchers("/api/partners/**", "/api/promotions/**").permitAll()

                        // SMS testing endpoints (development only - should be removed in production)
                        .requestMatchers("/sms/**").permitAll()

                        // All other requests require authentication
                        .anyRequest().authenticated())

                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt
                                .decoder(hybridJwtDecoder)
                                .jwtAuthenticationConverter(jwtAuthenticationConverter())
                        )
                        .authenticationEntryPoint(customAuthenticationEntryPoint)
                );

        return http.build();
    }
}
