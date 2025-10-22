package com.example.backend.entity;

import com.example.backend.entity.enums.StoreStatus;
import com.example.backend.entity.enums.SuggestionStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "store_pending_updates")
public class StorePendingUpdate {
    
    @Id
    @UuidGenerator
    private String updateId;

    // Store being updated
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id", nullable = false)
    private Store store;

    // Pending update fields (nullable means no change requested for that field)
    private String storeName;
    private String address;
    private String phoneNumber;
    private String description;
    private Double latitude;
    private Double longitude;
    private String imageUrl;
    private LocalTime openTime;
    private LocalTime closeTime;

    @Enumerated(EnumType.STRING)
    private StoreStatus status;

    // Update status
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SuggestionStatus updateStatus = SuggestionStatus.PENDING;

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
