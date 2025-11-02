package com.example.backend.scheduler;

import com.example.backend.service.AutomatedSuspensionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Scheduled jobs for automated violation checking and suspension enforcement
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ViolationCheckScheduler {

    private final AutomatedSuspensionService suspensionService;

    /**
     * Check for expired suspensions every hour and automatically reinstate customers
     */
    @Scheduled(cron = "0 0 * * * *") // Every hour at minute 0
    public void processExpiredSuspensions() {
        log.info("=== Starting scheduled task: Process expired suspensions ===");
        try {
            suspensionService.processExpiredSuspensions();
            log.info("=== Completed scheduled task: Process expired suspensions ===");
        } catch (Exception e) {
            log.error("Error processing expired suspensions", e);
        }
    }

    /**
     * Additional periodic checks can be added here as needed
     * For example, daily violation summary reports, etc.
     */
}
