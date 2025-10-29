package com.example.backend.entity;

import com.example.backend.entity.enums.BannerStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "banners", indexes = {
    @Index(name = "idx_banner_status", columnList = "status"),
    @Index(name = "idx_banner_created", columnList = "createdAt")
})
public class Banner {
    @Id
    @UuidGenerator
    private String bannerId;

    @Column(nullable = false, length = 255)
    private String imageUrl; // URL ảnh banner

    @Column(length = 200)
    private String title; // Tiêu đề banner (optional)

    @Column(length = 1000)
    private String description; // Mô tả banner (optional)

    @Column(length = 500)
    private String linkUrl; // URL khi click vào banner (optional)

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BannerStatus status = BannerStatus.ACTIVE; // ACTIVE or INACTIVE

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
