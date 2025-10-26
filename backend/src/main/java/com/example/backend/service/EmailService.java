package com.example.backend.service;

/**
 * Email service for sending emails via SendGrid
 */
public interface EmailService {

    /**
     * Send verification email to customer
     *
     * @param toEmail Recipient email address
     * @param fullName Recipient full name
     * @param verificationToken Token for email verification
     */
    void sendVerificationEmail(String toEmail, String fullName, String verificationToken);

    /**
     * Send welcome email after successful verification
     *
     * @param toEmail Recipient email address
     * @param fullName Recipient full name
     */
    void sendWelcomeEmail(String toEmail, String fullName);

    /**
     * Send approval notification email to supplier
     *
     * @param toEmail Recipient email address
     * @param fullName Recipient full name
     */
    void sendSupplierApprovalEmail(String toEmail, String fullName);

    /**
     * Send rejection notification email to supplier
     *
     * @param toEmail Recipient email address
     * @param fullName Recipient full name
     * @param reason Reason for rejection
     */
    void sendSupplierRejectionEmail(String toEmail, String fullName, String reason);

    /**
     * Send password reset email
     *
     * @param toEmail Recipient email address
     * @param fullName Recipient full name
     * @param resetToken Token for password reset
     */
    void sendPasswordResetEmail(String toEmail, String fullName, String resetToken);

    /**
     * Send OTP email for verification
     *
     * @param toEmail Recipient email address
     * @param otp OTP code (6 digits)
     */
    void sendOtpEmail(String toEmail, String otp);

    /**
     * Send OTP email for password reset
     *
     * @param toEmail Recipient email address
     * @param otp OTP code (6 digits)
     */
    void sendPasswordResetOtpEmail(String toEmail, String otp);

    /**
     * Send generic email with custom subject and message
     *
     * @param toEmail Recipient email address
     * @param subject Email subject
     * @param message Email message body (plain text or HTML)
     */
    void sendEmail(String toEmail, String subject, String message);
}
