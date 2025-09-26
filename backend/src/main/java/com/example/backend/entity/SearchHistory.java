package com.example.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "search_histories")
public class SearchHistory {

    @Id
    @UuidGenerator
    private String searchId;

    @Column(nullable = false)
    private String searchQuery; // Nội dung/từ khóa người dùng đã tìm

    @CreationTimestamp
    private LocalDateTime searchedAt; // Thời điểm tìm kiếm

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;
}