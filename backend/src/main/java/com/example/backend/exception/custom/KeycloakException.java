package com.example.backend.exception.custom;

import com.example.backend.exception.BaseException;
import com.example.backend.exception.ErrorCode;

import java.util.Map;

public class KeycloakException extends BaseException {
    public KeycloakException(String operation, String userId, Throwable cause) {
        super(ErrorCode.KEYCLOAK_USER_CREATION_FAILED,
                "Lỗi Keycloak trong quá trình " + operation,
                Map.of("operation", operation, "userId", userId != null ? userId : "unknown"),
                cause);
    }

    public KeycloakException(ErrorCode errorCode, Map<String, Object> details, Throwable cause) {
        super(errorCode, null, details, cause);
    }
}

