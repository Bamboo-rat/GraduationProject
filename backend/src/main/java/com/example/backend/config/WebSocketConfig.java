package com.example.backend.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket configuration for real-time chat messaging
 * Enables STOMP protocol over WebSocket for bidirectional communication
 */
@Slf4j
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtChannelInterceptor jwtChannelInterceptor;

    /**
     * Configure message broker
     * - Simple in-memory broker for broadcasting messages
     * - Application destination prefix for client-to-server messages
     */
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable simple in-memory message broker for user-specific queues and topics
        config.enableSimpleBroker("/queue", "/topic");

        // Set application destination prefix for messages sent from client
        config.setApplicationDestinationPrefixes("/app");

        // Set user destination prefix for user-specific messages
        config.setUserDestinationPrefix("/user");

        log.info("Message broker configured with prefixes: /app (client), /queue and /topic (server)");
    }

    /**
     * Register STOMP endpoints
     * - /ws/chat: WebSocket endpoint for chat messaging
     * - SockJS fallback enabled for browsers that don't support WebSocket
     * - CORS allowed for all origins (configure based on environment)
     */
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws/chat")
                .setAllowedOriginPatterns("*") // Allow all origins (configure for production)
                .withSockJS(); // Enable SockJS fallback

        log.info("STOMP endpoint registered: /ws/chat with SockJS fallback");
    }

    /**
     * Configure client inbound channel
     * - Add JWT authentication interceptor to validate tokens
     */
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(jwtChannelInterceptor);
        log.info("JWT authentication interceptor registered for WebSocket connections");
    }
}
