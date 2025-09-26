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

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "category_suggestion")
public class CategorySuggestion {
    @Id
    @UuidGenerator
    private String suggestionId;

    @Column(nullable = false)
    private String name; // Tên danh mục được đề xuất

    @Column(columnDefinition = "TEXT")
    private String reason; // Lý do đề xuất của nhà cung cấp

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SuggestionStatus status = SuggestionStatus.PENDING; // Mặc định là chờ duyệt

    @Column(columnDefinition = "TEXT")
    private String adminNotes; // Ghi chú của admin khi duyệt hoặc từ chối

    @CreationTimestamp
    private LocalDateTime createdAt;

    private LocalDateTime processedAt; // Thời gian được xử lý (duyệt/từ chối)

    // Nhà cung cấp nào đã đề xuất
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "suggester_id", nullable = false)
    private Supplier suggester;

    // Admin nào đã xử lý
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "processor_id")
    private Admin processor;
}
