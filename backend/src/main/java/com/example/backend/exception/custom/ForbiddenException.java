package com.example.backend.exception.custom;

import com.example.backend.exception.BaseException;
import com.example.backend.exception.ErrorCode;

public class ForbiddenException extends BaseException {

    public ForbiddenException(ErrorCode errorCode) {
        super(errorCode);
    }

    public ForbiddenException(ErrorCode errorCode, String details) {
        super(errorCode, details);
    }
}