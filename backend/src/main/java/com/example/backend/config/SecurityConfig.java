package com.example.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

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
                                "/api/auth/login/customer/**",
                                "/api/auth/register/**",
                                "/api/auth/forgot-password",
                                "/api/auth/verify-reset-otp",
                                "/api/auth/reset-password",
                                "/api/banners/active"
                        ).permitAll()
                        .requestMatchers("/api/auth/me").authenticated()
                        .requestMatchers("/sms/**", "/api/admins/**","/api/files/**","/api/products/**", "/api/categories/**", "/api/partners/**", "/api/promotions/**").permitAll()
                        .requestMatchers("/api/customers/**").hasAnyRole("CUSTOMER","SUPER_ADMIN", "MODERATOR", "STAFF")
                        .requestMatchers("/api/suppliers/**").hasAnyRole("SUPER_ADMIN", "MODERATOR", "STAFF","SUPPLIER")
                        .anyRequest().authenticated())

                .oauth2ResourceServer(
                        oauth2 -> oauth2.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter())));

        return http.build();
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(new KeycloakRoleConverter());
        return converter;
    }
}
