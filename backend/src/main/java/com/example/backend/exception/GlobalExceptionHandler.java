package com.example.backend.exception;

import com.example.backend.exception.custom.BadRequestException;
import com.example.backend.exception.custom.UnauthorizedException;
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

    // Xử lý UnauthorizedException (account inactive, suspended, etc.)
    @ExceptionHandler(value =  UnauthorizedException.class)
    public ResponseEntity<ErrorResponse> handleUnauthorizedException(UnauthorizedException e) {
        log.warn("Unauthorized Exception: {}", e.getMessage());
        ErrorCode errorCode = e.getErrorCode();
        String message = e.getCustomMessage() != null ? e.getCustomMessage() : errorCode.getVietnameseMessage();
        ErrorResponse response = new ErrorResponse(errorCode.getCode(), errorCode.getMessage(), message);
        return ResponseEntity.status(errorCode.getHttpStatus()).body(response);
    }

    // Xử lý BadRequestException
    @ExceptionHandler(value = BadRequestException.class)
    public ResponseEntity<ErrorResponse> handleBadRequestException(BadRequestException e) {
        log.warn("Bad Request Exception: {}", e.getMessage());
        ErrorCode errorCode = e.getErrorCode();
        String message = e.getCustomMessage() != null ? e.getCustomMessage() : errorCode.getVietnameseMessage();
        ErrorResponse response = new ErrorResponse(errorCode.getCode(), errorCode.getMessage(), message);
        return ResponseEntity.status(errorCode.getHttpStatus()).body(response);
    }

    // Xử lý các lỗi validation từ @Valid
    @ExceptionHandler(value = MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(MethodArgumentNotValidException e) {
        // Build detailed error message with all field errors
        StringBuilder detailedMessage = new StringBuilder("Validation errors: ");
        e.getBindingResult().getFieldErrors().forEach(error -> {
            detailedMessage.append(String.format("[%s: %s] ", error.getField(), error.getDefaultMessage()));
        });

        String errorDetails = detailedMessage.toString();
        log.error("Validation Exception: {}", errorDetails);

        ErrorCode errorCode = ErrorCode.VALIDATION_ERROR;
        ErrorResponse response = new ErrorResponse(errorCode.getCode(), errorCode.getMessage(), errorDetails);
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