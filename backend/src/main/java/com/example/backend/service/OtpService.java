package com.example.backend.service;

/**
 * Service for OTP (One-Time Password) and Token management via Redis
 */
public interface OtpService {

    /**
     * Send OTP to phone number via SMS
     * @param phone Phone number
     */
    void sendOtp(String phone);

    /**
     * Send OTP to email
     * @param email Email address
     */
    void sendOtpToEmail(String email);

    /**
     * Verify OTP
     * phone or email
     * @param otp OTP code
     * @return true if valid
     */
    boolean verifyOtp(String phoneOrEmail, String otp);

    /**
     * Send OTP to email for password reset
     * @param email Email address
     */
    void sendPasswordResetOtp(String email);

    /**
     * Verify password reset OTP (without consuming it yet)
     * @param email Email address
     * @param otp OTP code
     * @return true if OTP is valid
     */
    boolean verifyPasswordResetOtp(String email, String otp);

    /**
     * Consume (delete) password reset OTP after successful verification
     * @param email Email address
     */
    void consumePasswordResetOtp(String email);
}
