package com.example.backend.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ErrorResponse {
    private String errorCode;
    private String message;
    private String userMessage;
    private String path;
    private String method;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime timestamp;

    private String traceId;
    private Map<String, Object> details;

    // For validation errors
    private Map<String, String> fieldErrors;

    // For debugging (only in dev environment)
    private String stackTrace;
}
