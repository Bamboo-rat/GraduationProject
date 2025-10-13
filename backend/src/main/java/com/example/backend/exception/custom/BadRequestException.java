package com.example.backend.exception.custom;

import com.example.backend.exception.ErrorCode;
import lombok.Getter;

@Getter
public class BadRequestException extends RuntimeException {
    private final ErrorCode errorCode;
    private final String customMessage;

    public BadRequestException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
        this.customMessage = null;
    }

    public BadRequestException(ErrorCode errorCode, String customMessage) {
        super(customMessage);
        this.errorCode = errorCode;
        this.customMessage = customMessage;
    }
}
