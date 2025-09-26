package com.example.backend.exception.custom;

import com.example.backend.exception.BaseException;
import com.example.backend.exception.ErrorCode;

public class ValidationException extends BaseException {

    public ValidationException(ErrorCode errorCode) {
        super(errorCode);
    }

    public ValidationException(ErrorCode errorCode, String details) {
        super(errorCode, details);
    }
}