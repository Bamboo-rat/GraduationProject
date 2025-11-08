package com.example.backend.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.stereotype.Component;

/**
 * JWT authentication interceptor for WebSocket connections
 * Validates JWT tokens from WebSocket STOMP headers
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtChannelInterceptor implements ChannelInterceptor {

    private final JwtDecoder jwtDecoder;
    private final HybridJwtAuthenticationConverter jwtAuthenticationConverter;

    /**
     * Intercept messages before they are sent to the channel
     * Extract and validate JWT token from STOMP headers
     */
    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            // Extract token from 'Authorization' header or 'token' parameter
            String token = extractToken(accessor);

            if (token != null) {
                try {
                    // Decode and validate JWT token
                    Jwt jwt = jwtDecoder.decode(token);

                    // Convert JWT to Spring Security Authentication
                    Authentication authentication = jwtAuthenticationConverter.convert(jwt);

                    // Set authentication in accessor
                    accessor.setUser(authentication);

                    log.info("WebSocket connection authenticated for user: {}", jwt.getSubject());
                } catch (Exception e) {
                    log.error("JWT authentication failed for WebSocket connection: {}", e.getMessage());
                    throw new IllegalArgumentException("Invalid JWT token for WebSocket connection", e);
                }
            } else {
                log.warn("WebSocket connection attempt without JWT token");
                throw new IllegalArgumentException("JWT token required for WebSocket connection");
            }
        }

        return message;
    }

    /**
     * Extract JWT token from STOMP headers
     * Supports both 'Authorization' header and 'token' parameter
     */
    private String extractToken(StompHeaderAccessor accessor) {
        // Try to get token from 'Authorization' header
        String authHeader = accessor.getFirstNativeHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }

        // Try to get token from 'token' parameter (alternative method)
        String token = accessor.getFirstNativeHeader("token");
        if (token != null) {
            return token;
        }

        return null;
    }
}
