package com.example.backend.entity;

import com.example.backend.entity.enums.SuggestionStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;

/**
 * Entity for tracking pending updates to supplier business information
 * Changes require admin approval before being applied
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "supplier_pending_updates")
public class SupplierPendingUpdate {
    
    @Id
    @UuidGenerator
    private String updateId;

    // Supplier requesting the update
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id", nullable = false)
    private Supplier supplier;

    // Pending update fields (nullable means no change requested for that field)
    private String taxCode;
    private String businessLicense;
    private String businessLicenseUrl;
    private String foodSafetyCertificate;
    private String foodSafetyCertificateUrl;

    // Update status
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SuggestionStatus updateStatus = SuggestionStatus.PENDING;

    @Column(columnDefinition = "TEXT")
    private String supplierNotes; // Supplier's reason for update

    @Column(columnDefinition = "TEXT")
    private String adminNotes; // Admin's notes when approving/rejecting

    @CreationTimestamp
    private LocalDateTime createdAt;

    private LocalDateTime processedAt;

    // Admin who processed the update
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_id")
    private Admin admin;
}
