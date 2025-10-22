package com.example.backend.service;

/**
 * Service for sending SMS messages via SpeedSMS API
 * Note: This service ONLY sends SMS. OTP generation and verification is handled by OtpService.
 */
public interface SmsService {

    /**
     * Send SMS message with OTP code
     * @param phoneNumber Phone number (formats: +84xxxxxxxxx, 84xxxxxxxxx, 0xxxxxxxxx)
     * @param content Message content to send
     * @return "success" if sent successfully, "failed" otherwise
     */
    String sendSms(String phoneNumber, String content);
}
