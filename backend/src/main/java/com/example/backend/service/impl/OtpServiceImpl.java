package com.example.backend.service.impl;

import com.example.backend.exception.ErrorCode;
import com.example.backend.exception.custom.BadRequestException;
import com.example.backend.service.EmailService;
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
 *       For Email OTP, this service generates OTP, stores in Redis, and sends via EmailService
 *       Both Phone and Email OTP verification is done by checking Redis
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OtpServiceImpl implements OtpService {

    private final RedisTemplate<String, String> redisTemplate;
    private final EmailService emailService;

    private static final int OTP_LENGTH = 6;
    private static final int OTP_EXPIRY_MINUTES = 3;
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

        // Send OTP via Email
        try {
            emailService.sendOtpEmail(email, otp);
            log.info("OTP sent successfully to email: {}", email);
        } catch (Exception e) {
            log.error("Failed to send OTP email to: {}", email, e);
            throw new RuntimeException("Failed to send OTP email. Please try again.");
        }
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
}
