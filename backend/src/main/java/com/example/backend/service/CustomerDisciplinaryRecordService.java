package com.example.backend.service;

import com.example.backend.entity.CustomerDisciplinaryRecord;
import com.example.backend.entity.enums.ViolationAction;
import com.example.backend.entity.enums.ViolationSeverity;
import com.example.backend.entity.enums.ViolationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Service interface for managing customer disciplinary records
 * Unified service replacing CustomerViolationService and CustomerSuspensionHistoryService
 */
public interface CustomerDisciplinaryRecordService {

    /**
     * Create a new disciplinary record
     */
    CustomerDisciplinaryRecord createRecord(CustomerDisciplinaryRecord record);

    /**
     * Get record by ID
     */
    Optional<CustomerDisciplinaryRecord> getRecordById(String recordId);

    /**
     * Get all records for a customer
     */
    List<CustomerDisciplinaryRecord> getCustomerRecords(String customerId);

    /**
     * Get customer records (paginated)
     */
    Page<CustomerDisciplinaryRecord> getCustomerRecords(String customerId, Pageable pageable);

    /**
     * Get unresolved violations for a customer
     */
    List<CustomerDisciplinaryRecord> getUnresolvedViolations(String customerId);

    /**
     * Get records by violation type
     */
    Page<CustomerDisciplinaryRecord> getRecordsByViolationType(ViolationType violationType, Pageable pageable);

    /**
     * Get records by severity
     */
    Page<CustomerDisciplinaryRecord> getRecordsBySeverity(ViolationSeverity severity, Pageable pageable);

    /**
     * Get records by action taken
     */
    Page<CustomerDisciplinaryRecord> getRecordsByAction(ViolationAction actionTaken, Pageable pageable);

    /**
     * Get currently suspended customers
     */
    List<CustomerDisciplinaryRecord> getCurrentlySuspendedCustomers();

    /**
     * Get expired suspensions (should be reinstated)
     */
    List<CustomerDisciplinaryRecord> getExpiredSuspensions();

    /**
     * Get suspension history for a customer
     */
    List<CustomerDisciplinaryRecord> getSuspensionHistory(String customerId);

    /**
     * Count violations by customer and type
     */
    long countViolations(String customerId, ViolationType violationType);

    /**
     * Count unresolved violations by customer
     */
    long countUnresolvedViolations(String customerId);

    /**
     * Count total suspensions for a customer
     */
    long countSuspensions(String customerId);

    /**
     * Get records by reference (e.g., order ID, review ID)
     */
    List<CustomerDisciplinaryRecord> getRecordsByReference(String referenceId, String referenceType);

    /**
     * Get records within date range
     */
    List<CustomerDisciplinaryRecord> getRecordsByDateRange(
            String customerId, 
            LocalDateTime startDate, 
            LocalDateTime endDate
    );

    /**
     * Resolve a disciplinary record
     */
    CustomerDisciplinaryRecord resolveRecord(String recordId, String adminId, String adminNotes);

    /**
     * Reinstate a suspended customer
     */
    CustomerDisciplinaryRecord reinstateCustomer(String recordId, String adminId);

    /**
     * Update record with admin review
     */
    CustomerDisciplinaryRecord reviewRecord(String recordId, String adminId, String adminNotes);

    /**
     * Delete a record
     */
    void deleteRecord(String recordId);

    /**
     * Process expired suspensions (scheduled task)
     * Returns count of reinstated customers
     */
    int processExpiredSuspensions();

    // ==================== STATISTICS METHODS ====================

    /**
     * Get violation statistics by type
     */
    Map<ViolationType, Long> getViolationStatistics();

    /**
     * Get violation statistics by severity
     */
    Map<ViolationSeverity, Long> getSeverityStatistics();

    /**
     * Check if customer has active suspension
     */
    boolean isCustomerSuspended(String customerId);

    /**
     * Get customer violation summary
     */
    Map<String, Object> getCustomerViolationSummary(String customerId);
}
