package com.example.backend.exception;

import lombok.Getter;

@Getter
public abstract class BaseException extends RuntimeException {

    private final ErrorCode errorCode;
    private final String details;

    public BaseException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
        this.details = null;
    }

    public BaseException(ErrorCode errorCode, String details) {
        super(errorCode.getMessage() + ": " + details);
        this.errorCode = errorCode;
        this.details = details;
    }

    public BaseException(ErrorCode errorCode, String details, Throwable cause) {
        super(errorCode.getMessage() + ": " + details, cause);
        this.errorCode = errorCode;
        this.details = details;
    }
}
