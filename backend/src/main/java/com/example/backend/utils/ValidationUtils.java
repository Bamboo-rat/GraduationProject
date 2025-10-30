package com.example.backend.utils;

import com.example.backend.exception.ErrorCode;
import com.example.backend.exception.custom.BadRequestException;
import lombok.experimental.UtilityClass;

import java.time.LocalDate;
import java.time.Period;
import java.util.regex.Pattern;

@UtilityClass
public class ValidationUtils {

    // Email regex pattern (RFC 5322 simplified)
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "^[a-zA-Z0-9_+&*-]+(?:\\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,7}$"
    );

    // Phone number pattern (Vietnam format: 10 digits starting with 0)
    private static final Pattern PHONE_PATTERN = Pattern.compile(
            "^0[0-9]{9}$"
    );

    // Password requirements
    private static final int MIN_PASSWORD_LENGTH = 8;
    private static final int MAX_PASSWORD_LENGTH = 100;
    private static final Pattern UPPERCASE_PATTERN = Pattern.compile(".*[A-Z].*");
    private static final Pattern LOWERCASE_PATTERN = Pattern.compile(".*[a-z].*");
    private static final Pattern DIGIT_PATTERN = Pattern.compile(".*[0-9].*");
    private static final Pattern SPECIAL_CHAR_PATTERN = Pattern.compile(".*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?].*");

    // Age requirement
    private static final int MIN_AGE = 18;

    // Tax code pattern (Vietnam: 10 or 13 digits)
    private static final Pattern TAX_CODE_PATTERN = Pattern.compile("^[0-9]{10}$|^[0-9]{13}$");

    /**
     * Validate email format
     *
     * @param email Email to validate
     * @throws BadRequestException if email is invalid
     */
    public static void validateEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            throw new BadRequestException(ErrorCode.INVALID_EMAIL);
        }

        if (!EMAIL_PATTERN.matcher(email.trim()).matches()) {
            throw new BadRequestException(ErrorCode.INVALID_EMAIL);
        }
    }

    /**
     * Validate password strength
     * Requirements:
     * - At least 8 characters
     * - At least one uppercase letter
     * - At least one lowercase letter
     * - At least one digit
     * - At least one special character
     *
     * @param password Password to validate
     * @throws BadRequestException if password is weak
     */
    public static void validatePassword(String password) {
        if (password == null || password.isEmpty()) {
            throw new BadRequestException(ErrorCode.WEAK_PASSWORD);
        }

        if (password.length() < MIN_PASSWORD_LENGTH) {
            throw new BadRequestException(ErrorCode.WEAK_PASSWORD, 
                    "Password must be at least " + MIN_PASSWORD_LENGTH + " characters long");
        }

        if (password.length() > MAX_PASSWORD_LENGTH) {
            throw new BadRequestException(ErrorCode.WEAK_PASSWORD, 
                    "Password must not exceed " + MAX_PASSWORD_LENGTH + " characters");
        }

        if (!UPPERCASE_PATTERN.matcher(password).matches()) {
            throw new BadRequestException(ErrorCode.WEAK_PASSWORD, 
                    "Password must contain at least one uppercase letter");
        }

        if (!LOWERCASE_PATTERN.matcher(password).matches()) {
            throw new BadRequestException(ErrorCode.WEAK_PASSWORD, 
                    "Password must contain at least one lowercase letter");
        }

        if (!DIGIT_PATTERN.matcher(password).matches()) {
            throw new BadRequestException(ErrorCode.WEAK_PASSWORD, 
                    "Password must contain at least one digit");
        }

        if (!SPECIAL_CHAR_PATTERN.matcher(password).matches()) {
            throw new BadRequestException(ErrorCode.WEAK_PASSWORD, 
                    "Password must contain at least one special character (!@#$%^&*()_+-=[]{}|:;'\"\\,.<>?/)");
        }
    }

    /**
     * Validate phone number format (Vietnam)
     *
     * @param phoneNumber Phone number to validate
     * @throws BadRequestException if phone number is invalid
     */
    public static void validatePhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            throw new BadRequestException(ErrorCode.INVALID_PHONE_NUMBER);
        }

        String cleanedPhone = phoneNumber.trim().replaceAll("\\s+", "");

        if (!PHONE_PATTERN.matcher(cleanedPhone).matches()) {
            throw new BadRequestException(ErrorCode.INVALID_PHONE_NUMBER, 
                    "Phone number must be 10 digits starting with 0");
        }
    }

    /**
     * Validate age (must be at least 18 years old)
     *
     * @param dateOfBirth Date of birth to validate
     * @throws BadRequestException if age is less than 18
     */
    public static void validateAge(LocalDate dateOfBirth) {
        if (dateOfBirth == null) {
            throw new BadRequestException(ErrorCode.INVALID_AGE, 
                    "Date of birth is required");
        }

        if (dateOfBirth.isAfter(LocalDate.now())) {
            throw new BadRequestException(ErrorCode.INVALID_AGE, 
                    "Date of birth cannot be in the future");
        }

        int age = Period.between(dateOfBirth, LocalDate.now()).getYears();

        if (age < MIN_AGE) {
            throw new BadRequestException(ErrorCode.INVALID_AGE, 
                    "You must be at least " + MIN_AGE + " years old to register");
        }
    }

    /**
     * Validate username format
     *
     * @param username Username to validate
     * @throws BadRequestException if username is invalid
     */
    public static void validateUsername(String username) {
        if (username == null || username.trim().isEmpty()) {
            throw new BadRequestException(ErrorCode.INVALID_INPUT, 
                    "Username cannot be empty");
        }

        if (username.length() < 3 || username.length() > 50) {
            throw new BadRequestException(ErrorCode.INVALID_INPUT, 
                    "Username must be between 3 and 50 characters");
        }

        if (!username.matches("^[a-zA-Z0-9_.-]+$")) {
            throw new BadRequestException(ErrorCode.INVALID_INPUT, 
                    "Username can only contain letters, numbers, dots, hyphens, and underscores");
        }
    }

    /**
     * Validate tax code format (Vietnam: 10 or 13 digits)
     *
     * @param taxCode Tax code to validate
     * @throws BadRequestException if tax code is invalid
     */
    public static void validateTaxCode(String taxCode) {
        if (taxCode == null || taxCode.trim().isEmpty()) {
            throw new BadRequestException(ErrorCode.INVALID_INPUT, 
                    "Tax code cannot be empty");
        }

        String cleanedTaxCode = taxCode.trim().replaceAll("\\s+", "");

        if (!TAX_CODE_PATTERN.matcher(cleanedTaxCode).matches()) {
            throw new BadRequestException(ErrorCode.INVALID_INPUT, 
                    "Tax code must be 10 or 13 digits");
        }
    }
}
