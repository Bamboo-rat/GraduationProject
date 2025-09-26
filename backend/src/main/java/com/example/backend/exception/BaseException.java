package com.example.backend.exception;

import lombok.Getter;

import java.util.Map;

@Getter
public abstract class BaseException extends RuntimeException {

    private final ErrorCode errorCode;
    private final String details;
    private final Map<String, Object> errorDetails;

    public BaseException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
        this.details = null;
        this.errorDetails = null;
    }

    public BaseException(ErrorCode errorCode, String details) {
        super(errorCode.getMessage() + ": " + details);
        this.errorCode = errorCode;
        this.details = details;
        this.errorDetails = null;
    }

    public BaseException(ErrorCode errorCode, String details, Throwable cause) {
        super(errorCode.getMessage() + ": " + details, cause);
        this.errorCode = errorCode;
        this.details = details;
        this.errorDetails = null;
    }

    public BaseException(ErrorCode errorCode, String message, Map<String, Object> errorDetails, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
        this.details = null; // Không dùng details dạng String nữa
        this.errorDetails = errorDetails;
    }
}
