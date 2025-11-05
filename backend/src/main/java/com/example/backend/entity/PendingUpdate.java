package com.example.backend.entity;

import com.example.backend.entity.enums.StoreStatus;
import com.example.backend.entity.enums.SuggestionStatus;
import com.example.backend.entity.enums.UpdateEntityType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Unified entity for tracking pending updates to Store and Supplier information
 * Replaces StorePendingUpdate and SupplierPendingUpdate tables
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "pending_updates", indexes = {
    @Index(name = "idx_pending_update_entity", columnList = "entityType, entityId"),
    @Index(name = "idx_pending_update_status", columnList = "updateStatus"),
    @Index(name = "idx_pending_update_created", columnList = "createdAt"),
    @Index(name = "idx_pending_update_type_status", columnList = "entityType, updateStatus")
})
public class PendingUpdate {
    
    @Id
    @UuidGenerator
    private String updateId;

    /**
     * Type of entity being updated (STORE or SUPPLIER)
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UpdateEntityType entityType;

    /**
     * ID of the entity being updated (storeId or supplierId)
     */
    @Column(nullable = false, length = 36)
    private String entityId;

    // ==================== STORE FIELDS ====================
    // These fields are used when entityType = STORE
    
    private String storeName;
    
    @Column(length = 500)
    private String address;
    
    @Column(length = 255)
    private String street;
    
    @Column(length = 100)
    private String ward;
    
    @Column(length = 100)
    private String district;
    
    @Column(length = 100)
    private String province;
    
    @Column(length = 20)
    private String phoneNumber;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    private Double latitude;
    private Double longitude;
    
    @Column(length = 500)
    private String imageUrl;
    
    private LocalTime openTime;
    private LocalTime closeTime;
    
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private StoreStatus storeStatus;

    // ==================== SUPPLIER FIELDS ====================
    // These fields are used when entityType = SUPPLIER
    
    @Column(length = 50)
    private String taxCode;
    
    @Column(length = 100)
    private String businessLicense;
    
    @Column(length = 500)
    private String businessLicenseUrl;
    
    @Column(length = 100)
    private String foodSafetyCertificate;
    
    @Column(length = 500)
    private String foodSafetyCertificateUrl;
    
    /**
     * Supplier's reason for requesting the update
     */
    @Column(columnDefinition = "TEXT")
    private String supplierNotes;

    // ==================== COMMON FIELDS ====================
    
    /**
     * Status of the update request
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SuggestionStatus updateStatus = SuggestionStatus.PENDING;

    /**
     * Admin's notes when approving/rejecting the update
     */
    @Column(columnDefinition = "TEXT")
    private String adminNotes;

    /**
     * When the update request was created
     */
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * When the update was processed by admin
     */
    private LocalDateTime processedAt;

    /**
     * Admin who processed the update
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_id")
    private Admin admin;

    /**
     * Store reference (only populated when entityType = STORE)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id")
    private Store store;

    /**
     * Supplier reference (only populated when entityType = SUPPLIER)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id")
    private Supplier supplier;
}
