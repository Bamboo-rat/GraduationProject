package com.example.backend.exception;

import jakarta.persistence.OptimisticLockException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;


@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    // Tạo một record hoặc class để định dạng response lỗi
    public record ErrorResponse(String code, String message, String vietnameseMessage) {}

    // Xử lý các exception tùy chỉnh của chúng ta
    @ExceptionHandler(value = BaseException.class)
    public ResponseEntity<ErrorResponse> handleBaseException(BaseException e) {
        log.error("Base Exception: {}", e.getMessage());
        ErrorCode errorCode = e.getErrorCode();
        ErrorResponse response = new ErrorResponse(errorCode.getCode(), errorCode.getMessage(), errorCode.getVietnameseMessage());
        return ResponseEntity.status(errorCode.getHttpStatus()).body(response);
    }

    // Xử lý các lỗi validation từ @Valid
    @ExceptionHandler(value = MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(MethodArgumentNotValidException e) {
        log.error("Validation Exception: {}", e.getMessage());
        ErrorCode errorCode = ErrorCode.VALIDATION_ERROR;
        // Lấy thông điệp lỗi validation chi tiết hơn (nếu cần)
        String details = e.getBindingResult().getFieldError() != null ? e.getBindingResult().getFieldError().getDefaultMessage() : errorCode.getVietnameseMessage();
        ErrorResponse response = new ErrorResponse(errorCode.getCode(), errorCode.getMessage(), details);
        return ResponseEntity.status(errorCode.getHttpStatus()).body(response);
    }

    // Xử lý Optimistic Locking Exceptions (Hibernate/JPA)
    @ExceptionHandler(value = {OptimisticLockException.class, ObjectOptimisticLockingFailureException.class})
    public ResponseEntity<ErrorResponse> handleOptimisticLockException(Exception e) {
        log.warn("Optimistic Lock Exception: {} - Entity: {}", e.getMessage(),
                e instanceof ObjectOptimisticLockingFailureException ?
                ((ObjectOptimisticLockingFailureException) e).getPersistentClassName() : "Unknown");

        ErrorCode errorCode = ErrorCode.OPTIMISTIC_LOCK_ERROR;
        ErrorResponse response = new ErrorResponse(
            errorCode.getCode(),
            errorCode.getMessage(),
            errorCode.getVietnameseMessage()
        );
        return ResponseEntity.status(errorCode.getHttpStatus()).body(response);
    }

    // Xử lý các lỗi không xác định (lỗi 500)
    @ExceptionHandler(value = Exception.class)
    public ResponseEntity<ErrorResponse> handleUncaughtException(Exception e) {
        log.error("Uncaught Exception: {}", e.getMessage(), e); // Log cả stack trace để debug
        ErrorCode errorCode = ErrorCode.INTERNAL_SERVER_ERROR;
        ErrorResponse response = new ErrorResponse(errorCode.getCode(), errorCode.getMessage(), errorCode.getVietnameseMessage());
        return ResponseEntity.status(errorCode.getHttpStatus()).body(response);
    }
}