package com.example.backend.service.impl;

import com.example.backend.entity.Customer;
import com.example.backend.entity.EmailVerificationToken;
import com.example.backend.entity.Supplier;
import com.example.backend.entity.enums.CustomerStatus;
import com.example.backend.entity.enums.SupplierStatus;
import com.example.backend.repository.CustomerRepository;
import com.example.backend.repository.EmailVerificationTokenRepository;
import com.example.backend.repository.SupplierRepository;
import com.example.backend.service.KeycloakService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Service for scheduled cleanup tasks
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CleanupScheduledService {

    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final CustomerRepository customerRepository;
    private final SupplierRepository supplierRepository;
    private final KeycloakService keycloakService;

    /**
     * Cleanup expired email verification tokens
     * Runs every day at 2:00 AM
     */
    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional
    public void cleanupExpiredEmailVerificationTokens() {
        log.info("Starting cleanup of expired email verification tokens");

        try {
            LocalDateTime now = LocalDateTime.now();

            // Find all tokens
            List<EmailVerificationToken> allTokens = emailVerificationTokenRepository.findAll();

            // Filter expired and not used tokens
            List<EmailVerificationToken> expiredTokens = allTokens.stream()
                    .filter(token -> !token.isUsed() && token.getExpiryDate().isBefore(now))
                    .toList();

            if (!expiredTokens.isEmpty()) {
                emailVerificationTokenRepository.deleteAll(expiredTokens);
                log.info("Deleted {} expired email verification tokens", expiredTokens.size());
            } else {
                log.info("No expired email verification tokens to delete");
            }

        } catch (Exception e) {
            log.error("Error during cleanup of expired email verification tokens", e);
        }
    }

    /**
     * Cleanup old used email verification tokens (older than 30 days)
     * Runs every week on Sunday at 3:00 AM
     */
    @Scheduled(cron = "0 0 3 ? * SUN")
    @Transactional
    public void cleanupOldUsedEmailVerificationTokens() {
        log.info("Starting cleanup of old used email verification tokens");

        try {
            LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);

            // Find all tokens
            List<EmailVerificationToken> allTokens = emailVerificationTokenRepository.findAll();

            // Filter used tokens older than 30 days
            List<EmailVerificationToken> oldUsedTokens = allTokens.stream()
                    .filter(token -> token.isUsed() && 
                            token.getVerifiedAt() != null && 
                            token.getVerifiedAt().isBefore(thirtyDaysAgo))
                    .toList();

            if (!oldUsedTokens.isEmpty()) {
                emailVerificationTokenRepository.deleteAll(oldUsedTokens);
                log.info("Deleted {} old used email verification tokens", oldUsedTokens.size());
            } else {
                log.info("No old used email verification tokens to delete");
            }

        } catch (Exception e) {
            log.error("Error during cleanup of old used email verification tokens", e);
        }
    }

    /**
     * Cleanup old pending accounts that haven't verified within 7 days
     * Runs daily at 3:00 AM
     */
    @Scheduled(cron = "0 0 3 * * ?")
    @Transactional
    public void cleanupOldPendingAccounts() {
        log.info("Starting cleanup of old pending accounts");

        try {
            LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);

            // Cleanup old pending customers (PENDING_VERIFICATION > 7 days)
            List<Customer> oldPendingCustomers = customerRepository
                    .findByStatusAndCreatedAtBefore(CustomerStatus.PENDING_VERIFICATION, sevenDaysAgo);

            int customersDeleted = 0;
            for (Customer customer : oldPendingCustomers) {
                log.info("Deleting old pending customer: {} (email: {}, created: {})",
                        customer.getUsername(), customer.getEmail(), customer.getCreatedAt());

                // Delete from Keycloak (best effort)
                try {
                    keycloakService.deleteUser(customer.getKeycloakId());
                    log.debug("Deleted Keycloak user: {}", customer.getKeycloakId());
                } catch (Exception e) {
                    log.error("Failed to delete Keycloak user: {}", customer.getKeycloakId(), e);
                }

                // Delete from DB
                customerRepository.delete(customer);
                customersDeleted++;
            }

            // Cleanup old pending suppliers (PENDING_APPROVAL > 7 days)
            List<Supplier> oldPendingSuppliers = supplierRepository
                    .findByStatusAndCreatedAtBefore(SupplierStatus.PENDING_APPROVAL, sevenDaysAgo);

            int suppliersDeleted = 0;
            for (Supplier supplier : oldPendingSuppliers) {
                log.info("Deleting old pending supplier: {} (email: {}, created: {})",
                        supplier.getUsername(), supplier.getEmail(), supplier.getCreatedAt());

                // Delete from Keycloak (best effort)
                try {
                    keycloakService.deleteUser(supplier.getKeycloakId());
                    log.debug("Deleted Keycloak user: {}", supplier.getKeycloakId());
                } catch (Exception e) {
                    log.error("Failed to delete Keycloak user: {}", supplier.getKeycloakId(), e);
                }

                // Delete from DB
                supplierRepository.delete(supplier);
                suppliersDeleted++;
            }

            log.info("Cleaned up {} old pending customers and {} old pending suppliers",
                    customersDeleted, suppliersDeleted);

        } catch (Exception e) {
            log.error("Error during cleanup of old pending accounts", e);
        }
    }
}
