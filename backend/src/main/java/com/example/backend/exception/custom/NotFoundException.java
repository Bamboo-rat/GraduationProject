package com.example.backend.exception.custom;

import com.example.backend.exception.BaseException;
import com.example.backend.exception.ErrorCode;

public class NotFoundException extends BaseException {

    public NotFoundException(ErrorCode errorCode) {
        super(errorCode);
    }

    public NotFoundException(ErrorCode errorCode, String details) {
        super(errorCode, details);
    }
}
