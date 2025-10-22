package com.example.backend.service;

/**
 * Service for OTP (One-Time Password) management
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
}
