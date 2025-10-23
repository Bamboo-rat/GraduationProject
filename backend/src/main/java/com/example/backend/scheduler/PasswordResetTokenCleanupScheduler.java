package com.example.backend.scheduler;

import com.example.backend.repository.PasswordResetTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Scheduled tasks for password reset token management
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PasswordResetTokenCleanupScheduler {

    private final PasswordResetTokenRepository passwordResetTokenRepository;

    /**
     * Clean up expired password reset tokens
     * Runs every day at 2:00 AM
     */
    @Scheduled(cron = "0 0 2 * * *") // Every day at 2:00 AM
    @Transactional
    public void cleanupExpiredTokens() {
        log.info("Starting scheduled cleanup of expired password reset tokens");

        try {
            LocalDateTime now = LocalDateTime.now();
            passwordResetTokenRepository.deleteExpiredTokens(now);
            
            log.info("Successfully cleaned up expired password reset tokens");
        } catch (Exception e) {
            log.error("Error during password reset token cleanup", e);
        }
    }
}
