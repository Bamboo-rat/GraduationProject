package com.example.backend.repository;

import com.example.backend.entity.Customer;
import com.example.backend.entity.enums.CustomerStatus;
import com.example.backend.entity.enums.CustomerTier;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, String> {
    Optional<Customer> findByUsername(String username);
    Optional<Customer> findByEmail(String email);
    Optional<Customer> findByPhoneNumber(String phoneNumber);
    Optional<Customer> findByKeycloakId(String keycloakId);
    List<Customer> findByStatus(CustomerStatus status);

    /**
     * Find customers by status and created before a specific date
     * Used for cleanup old pending accounts
     */
    List<Customer> findByStatusAndCreatedAtBefore(CustomerStatus status, LocalDateTime createdAt);

    /**
     * Find customers with pagination, filtering by status, tier, and search text
     * @param status Filter by customer status (nullable)
     * @param tier Filter by customer tier (nullable)
     * @param search Search in fullName, email, phoneNumber (nullable)
     * @param pageable Pagination parameters
     * @return Page of customers
     */
    @Query("SELECT c FROM Customer c WHERE " +
           "(:status IS NULL OR c.status = :status) AND " +
           "(:tier IS NULL OR c.tier = :tier) AND " +
            "(:search IS NULL OR (" +
           "LOWER(c.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(c.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(c.phoneNumber) LIKE LOWER(CONCAT('%', :search, '%'))))")
    Page<Customer> findByStatusAndTierAndSearch(
            @Param("status") CustomerStatus status,
            @Param("tier") CustomerTier tier,
            @Param("search") String search,
            Pageable pageable
    );

    /**
     * Count customers by status
     */
    long countByStatus(CustomerStatus status);

    /**
     * Count customers by tier
     */
    long countByTier(CustomerTier tier);

    /**
     * Count customers created within date range
     */
    @Query("SELECT COUNT(c) FROM Customer c " +
           "WHERE c.createdAt BETWEEN :startDate AND :endDate")
    Long countByCreatedAtBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
}
