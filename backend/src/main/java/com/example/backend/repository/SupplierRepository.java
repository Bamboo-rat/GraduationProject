package com.example.backend.repository;

import com.example.backend.entity.Supplier;
import com.example.backend.entity.enums.SupplierStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, String> {
    Optional<Supplier> findByUsername(String username);
    Optional<Supplier> findByEmail(String email);
    Optional<Supplier> findByKeycloakId(String keycloakId);
    List<Supplier> findByStatus(SupplierStatus status);
    Optional<Supplier> findByBusinessLicense(String businessLicense);
    Optional<Supplier> findByTaxCode(String taxCode);

    /**
     * Find suppliers by status and created before a specific date
     * Used for cleanup old pending accounts
     */
    List<Supplier> findByStatusAndCreatedAtBefore(SupplierStatus status, LocalDateTime createdAt);

    // Admin queries for listing suppliers with pagination
    Page<Supplier> findByStatus(SupplierStatus status, Pageable pageable);

    @Query(value = "SELECT s FROM Supplier s WHERE " +
           "(:status IS NULL OR s.status = :status) AND " +
           "(:search IS NULL OR " +
           "LOWER(s.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(s.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(s.username) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(s.businessName) LIKE LOWER(CONCAT('%', :search, '%')))",
           countQuery = "SELECT COUNT(s) FROM Supplier s WHERE " +
           "(:status IS NULL OR s.status = :status) AND " +
           "(:search IS NULL OR " +
           "LOWER(s.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(s.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(s.username) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(s.businessName) LIKE LOWER(CONCAT('%', :search, '%')))")
    @EntityGraph(attributePaths = {"wallet"})
    Page<Supplier> findByStatusAndSearch(
            @Param("status") SupplierStatus status,
            @Param("search") String search,
            Pageable pageable
    );
}
