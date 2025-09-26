package com.example.backend.exception.custom;

import com.example.backend.exception.BaseException;
import com.example.backend.exception.ErrorCode;

public class ConflictException extends BaseException {

    public ConflictException(ErrorCode errorCode) {
        super(errorCode);
    }

    public ConflictException(ErrorCode errorCode, String details) {
        super(errorCode, details);
    }
}