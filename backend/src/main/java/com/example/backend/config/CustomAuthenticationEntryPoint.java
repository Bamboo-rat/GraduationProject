package com.example.backend.config;

import com.example.backend.dto.response.ApiResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Custom authentication entry point to handle authentication failures
 * and provide detailed error messages for debugging
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CustomAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                        AuthenticationException authException) throws IOException, ServletException {
        
        log.error("Authentication failed for request: {} {}", request.getMethod(), request.getRequestURI());
        log.error("Authentication exception: {}", authException.getMessage(), authException);
        
        // Check if there was an authorization header
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || authHeader.isEmpty()) {
            log.error("No Authorization header present in request");
        } else if (!authHeader.startsWith("Bearer ")) {
            log.error("Authorization header does not start with 'Bearer ': {}", authHeader);
        } else {
            String token = authHeader.substring(7);
            log.error("JWT token present but validation failed. Token length: {}, Token prefix: {}", 
                     token.length(), token.substring(0, Math.min(20, token.length())));
        }

        response.setContentType("application/json;charset=UTF-8");
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

        ApiResponse<Void> apiResponse = ApiResponse.<Void>builder()
                .success(false)
                .message("Xác thực thất bại. Vui lòng đăng nhập lại.")
                .build();

        response.getWriter().write(objectMapper.writeValueAsString(apiResponse));
    }
}
