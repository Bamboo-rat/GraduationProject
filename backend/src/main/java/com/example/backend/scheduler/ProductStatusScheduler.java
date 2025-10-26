package com.example.backend.scheduler;

import com.example.backend.service.ProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Scheduled tasks for automatic product status management
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ProductStatusScheduler {

    private final ProductService productService;

    /**
     * Auto-set products to INACTIVE if they've been SOLD_OUT or EXPIRED for more than 1 day
     * Runs every day at 3:00 AM
     */
    @Scheduled(cron = "0 0 3 * * *") // Every day at 3:00 AM
    public void autoSetInactiveForOldProducts() {
        log.info("Starting scheduled task: Auto-set INACTIVE for old SOLD_OUT/EXPIRED products");

        try {
            productService.autoSetInactiveForOldProducts();
            log.info("Completed scheduled task: Auto-set INACTIVE for old products");
        } catch (Exception e) {
            log.error("Error during auto-INACTIVE product status update", e);
        }
    }
}
