package com.example.backend.service.impl;

import com.example.backend.entity.enums.EmailNotificationType;
import com.example.backend.exception.ErrorCode;
import com.example.backend.exception.custom.BadRequestException;
import com.example.backend.service.EmailService;
import com.example.backend.service.NotificationService;
import com.example.backend.service.OtpService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Random;
import java.util.concurrent.TimeUnit;

/**
 * Service for OTP (One-Time Password) management
 * Supports both Phone and Email OTP with rate limiting
 * Rate Limit: Maximum 3 OTP requests per hour per phone/email
 *
 * Note: For Phone OTP, this service generates OTP, stores in Redis, and displays on console (for demo)
 *       For Email OTP, this service generates OTP, stores in Redis, and sends via NotificationService (tracked in DB)
 *       Both Phone and Email OTP verification is done by checking Redis
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OtpServiceImpl implements OtpService {

    private final RedisTemplate<String, String> redisTemplate;
    private final EmailService emailService;
    private final NotificationService notificationService;

    private static final int OTP_EXPIRY_MINUTES = 3;
    private static final int PASSWORD_RESET_OTP_EXPIRY_MINUTES = 10;
    private static final int MAX_OTP_REQUESTS_PER_HOUR = 3;
    private static final int RATE_LIMIT_WINDOW_HOURS = 1;

    @Override
    public void sendOtp(String phone) {
        log.info("Sending OTP to phone: {}", phone);

        // Normalize phone number for consistent rate limit tracking
        String normalizedPhone = normalizePhone(phone);

        // Check rate limit
        checkRateLimit("phone", normalizedPhone);

        // Generate OTP
        String otp = generateOtp();

        // Store OTP in Redis with expiry
        redisTemplate.opsForValue().set(
            "otp:phone:" + normalizedPhone,
            otp,
            OTP_EXPIRY_MINUTES,
            TimeUnit.MINUTES
        );

        // Increment rate limit counter
        incrementRateLimitCounter("phone", normalizedPhone);

        // Display OTP on console for demo purposes (instead of sending SMS)
        System.out.println("=".repeat(60));
        System.out.println("OTP for phone " + normalizedPhone + " is " + otp);
        System.out.println("=".repeat(60));
        log.info("OTP displayed on console for phone: {}", normalizedPhone);
        log.info("OTP for phone " + normalizedPhone + " is " + otp);
    }

    @Override
    public void sendOtpToEmail(String email) {
        log.info("Sending OTP to email: {}", email);

        // Check rate limit
        checkRateLimit("email", email);

        String otp = generateOtp();

        // Store OTP in Redis with expiry
        redisTemplate.opsForValue().set(
            "otp:email:" + email,
            otp,
            OTP_EXPIRY_MINUTES,
            TimeUnit.MINUTES
        );

        // Increment rate limit counter
        incrementRateLimitCounter("email", email);

        // Queue OTP email via NotificationService (tracked in DB)
        try {
            // Build email content using EmailService template
            String htmlContent = buildOtpEmailContent(otp);
            String subject = "Your Verification Code - SaveFood Platform";

            // Queue notification for sending and tracking
            notificationService.queueNotification(
                EmailNotificationType.OTP_EMAIL,
                email,
                subject,
                htmlContent,
                email // relatedEntityId = email for reference
            );

            log.info("OTP email queued successfully for: {}", email);
        } catch (Exception e) {
            log.error("Failed to queue OTP email for: {}", email, e);
            throw new RuntimeException("Failed to send OTP email. Please try again.");
        }
    }

    /**
     * Build OTP email HTML content
     */
    private String buildOtpEmailContent(String otp) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background-color: #FF6B35; color: white; padding: 20px; text-align: center; }
                        .content { padding: 30px; background-color: #f9f9f9; }
                        .otp-box { background-color: #fff; border: 2px solid #FF6B35; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
                        .otp-code { font-size: 32px; font-weight: bold; color: #FF6B35; letter-spacing: 8px; }
                        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                        .warning { color: #d9534f; font-size: 14px; margin-top: 15px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>SaveFood Platform</h1>
                        </div>
                        <div class="content">
                            <h2>Your Verification Code</h2>
                            <p>You have requested a verification code to access your SaveFood account.</p>

                            <div class="otp-box">
                                <p style="margin: 0; color: #666;">Your verification code is:</p>
                                <div class="otp-code">""" + otp + """
                                </div>
                            </div>

                            <p>This code will expire in <strong>3 minutes</strong>.</p>
                            <p>If you didn't request this code, please ignore this email.</p>

                            <div class="warning">
                                ⚠️ Never share this code with anyone. SaveFood staff will never ask for your verification code.
                            </div>
                        </div>
                        <div class="footer">
                            <p>&copy; 2025 SaveFood Platform. All rights reserved.</p>
                            <p>This is an automated email. Please do not reply.</p>
                        </div>
                    </div>
                </body>
                </html>
                """;
    }

    @Override
    public boolean verifyOtp(String phoneOrEmail, String otp) {
        log.info("Verifying OTP for: {}", phoneOrEmail);

        // Decide if this is an email-based OTP or phone-based OTP
        boolean isEmail = phoneOrEmail != null && phoneOrEmail.contains("@");

        String redisKey;
        String normalizedIdentifier;

        if (isEmail) {
            // Email-based OTP
            normalizedIdentifier = phoneOrEmail;
            redisKey = "otp:email:" + normalizedIdentifier;
        } else {
            // Phone-based OTP
            normalizedIdentifier = normalizePhone(phoneOrEmail);
            redisKey = "otp:phone:" + normalizedIdentifier;
        }

        // Get OTP from Redis
        String cachedOtp = redisTemplate.opsForValue().get(redisKey);
        if (cachedOtp == null) {
            log.warn("OTP not found or expired for: {}", normalizedIdentifier);
            return false;
        }

        // Verify OTP
        boolean isValid = otp.equals(cachedOtp);
        if (isValid) {
            // Delete OTP from Redis after successful verification
            redisTemplate.delete(redisKey);
            log.info("OTP verified successfully for: {}", normalizedIdentifier);
        } else {
            log.warn("Invalid OTP provided for: {}", normalizedIdentifier);
        }

        return isValid;
    }
    
    /**
     * Generate random 6-digit OTP
     */
    private String generateOtp() {
        Random random = new Random();
        int otp = random.nextInt(900000) + 100000; // Generates 100000-999999
        return String.valueOf(otp);
    }

    /**
     * Check if rate limit has been exceeded for OTP requests
     * @param type "phone" or "email"
     * @param identifier Phone number or email address
     */
    private void checkRateLimit(String type, String identifier) {
        String rateLimitKey = "otp:ratelimit:" + type + ":" + identifier;
        String countStr = redisTemplate.opsForValue().get(rateLimitKey);

        if (countStr != null) {
            int count = Integer.parseInt(countStr);
            if (count >= MAX_OTP_REQUESTS_PER_HOUR) {
                log.warn("OTP rate limit exceeded for {}: {}", type, identifier);
                throw new BadRequestException(ErrorCode.OTP_RATE_LIMIT_EXCEEDED);
            }
        }
    }

    /**
     * Increment rate limit counter for OTP requests
     * @param type "phone" or "email"
     * @param identifier Phone number or email address
     */
    private void incrementRateLimitCounter(String type, String identifier) {
        String rateLimitKey = "otp:ratelimit:" + type + ":" + identifier;
        String countStr = redisTemplate.opsForValue().get(rateLimitKey);

        if (countStr == null) {
            // First request - set counter to 1 with 1 hour expiry
            redisTemplate.opsForValue().set(
                rateLimitKey,
                "1",
                RATE_LIMIT_WINDOW_HOURS,
                TimeUnit.HOURS
            );
        } else {
            // Increment existing counter
            redisTemplate.opsForValue().increment(rateLimitKey);
        }

        log.debug("OTP rate limit counter incremented for {}: {}", type, identifier);
    }

    /**
     * Normalize a phone number for consistent Redis keying (E.164-like formatting).
     * This ensures that the same human-entered number maps to the same key.
     */
    private String normalizePhone(String raw) {
        if (raw == null || raw.isBlank()) return raw;
        String digits = raw.replaceAll("[^0-9+]", "");
        if (digits.startsWith("+")) return digits; // already E.164
        if (digits.startsWith("0")) return "+84" + digits.substring(1); // Vietnam local to +84
        if (digits.startsWith("84")) return "+" + digits; // missing '+'
        return "+" + digits; // fallback
    }

    @Override
    public void sendPasswordResetOtp(String email) {
        log.info("Sending password reset OTP to email: {}", email);

        // Check rate limit
        checkRateLimit("reset", email);

        // Generate OTP
        String otp = generateOtp();

        // Store OTP in Redis with 10-minute expiry
        redisTemplate.opsForValue().set(
            "reset-otp:email:" + email,
            otp,
            PASSWORD_RESET_OTP_EXPIRY_MINUTES,
            TimeUnit.MINUTES
        );

        // Increment rate limit counter
        incrementRateLimitCounter("reset", email);

        // Queue password reset OTP email via NotificationService (tracked in DB)
        try {
            // Build email content
            String htmlContent = buildPasswordResetOtpEmailContent(otp);
            String subject = "Password Reset Code - SaveFood Platform";

            // Queue notification for sending and tracking
            notificationService.queueNotification(
                EmailNotificationType.PASSWORD_RESET_OTP,
                email,
                subject,
                htmlContent,
                email // relatedEntityId = email for reference
            );

            log.info("Password reset OTP email queued successfully for: {}", email);
        } catch (Exception e) {
            log.error("Failed to queue password reset OTP email for: {}", email, e);
            throw new RuntimeException("Failed to send password reset OTP email. Please try again.");
        }
    }

    /**
     * Build password reset OTP email HTML content
     */
    private String buildPasswordResetOtpEmailContent(String otp) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background-color: #FF6B35; color: white; padding: 20px; text-align: center; }
                        .content { padding: 30px; background-color: #f9f9f9; }
                        .otp-box { background-color: #fff; border: 2px solid #FF6B35; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
                        .otp-code { font-size: 32px; font-weight: bold; color: #FF6B35; letter-spacing: 8px; }
                        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                        .warning { color: #d9534f; font-size: 14px; margin-top: 15px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>SaveFood Platform</h1>
                        </div>
                        <div class="content">
                            <h2>Password Reset Code</h2>
                            <p>You have requested to reset your password for your SaveFood account.</p>

                            <div class="otp-box">
                                <p style="margin: 0; color: #666;">Your password reset code is:</p>
                                <div class="otp-code">""" + otp + """
                                </div>
                            </div>

                            <p>This code will expire in <strong>10 minutes</strong>.</p>
                            <p>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>

                            <div class="warning">
                                ⚠️ Never share this code with anyone. SaveFood staff will never ask for your password reset code.
                            </div>
                        </div>
                        <div class="footer">
                            <p>&copy; 2025 SaveFood Platform. All rights reserved.</p>
                            <p>This is an automated email. Please do not reply.</p>
                        </div>
                    </div>
                </body>
                </html>
                """;
    }

    @Override
    public boolean verifyPasswordResetOtp(String email, String otp) {
        log.info("Verifying password reset OTP for email: {}", email);

        String redisKey = "reset-otp:email:" + email;

        // Get OTP from Redis
        String cachedOtp = redisTemplate.opsForValue().get(redisKey);
        if (cachedOtp == null) {
            log.warn("Password reset OTP not found or expired for: {}", email);
            return false;
        }

        // Verify OTP
        boolean isValid = otp.equals(cachedOtp);
        if (isValid) {
            log.info("Password reset OTP verified successfully for: {}", email);
        } else {
            log.warn("Invalid password reset OTP provided for: {}", email);
        }

        return isValid;
    }

    @Override
    public void consumePasswordResetOtp(String email) {
        log.info("Consuming password reset OTP for email: {}", email);
        String redisKey = "reset-otp:email:" + email;
        redisTemplate.delete(redisKey);
        log.info("Password reset OTP consumed (deleted) for: {}", email);
    }
}
