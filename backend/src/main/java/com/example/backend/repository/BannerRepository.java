package com.example.backend.repository;

import com.example.backend.entity.Banner;
import com.example.backend.entity.enums.BannerStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for Banner entity
 */
@Repository
public interface BannerRepository extends JpaRepository<Banner, String> {

    /**
     * Find all banners by status
     */
    List<Banner> findByStatus(BannerStatus status);

    /**
     * Find all banners by status with pagination
     */
    Page<Banner> findByStatus(BannerStatus status, Pageable pageable);

    /**
     * Find all active banners ordered by creation date desc
     */
    List<Banner> findByStatusOrderByCreatedAtDesc(BannerStatus status);
}
