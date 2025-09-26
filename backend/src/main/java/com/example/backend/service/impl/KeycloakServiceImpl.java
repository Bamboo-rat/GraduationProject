package com.example.backend.service.impl;

import org.springframework.beans.factory.annotation.Value;


public class KeycloakServiceImpl {
//    private final Keycloak keycloakAdminClient;

    @Value("${keycloak.realm}")
    private String realm;

    @Value("${keycloak.auth-server-url}")
    private String authServerUrl;

    @Value("${spring.security.oauth2.resourceserver.jwt.issuer-uri}")
    private String issuerUri;

    @Value("${keycloak.resource}")
    private String loginClientId;

    @Value("${keycloak.customer.client-secret}")
    private String loginClientSecret;


}
