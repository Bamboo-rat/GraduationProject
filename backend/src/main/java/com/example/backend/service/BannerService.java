package com.example.backend.service;

import com.example.backend.dto.request.BannerRequest;
import com.example.backend.dto.response.BannerResponse;
import com.example.backend.entity.enums.BannerStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface BannerService {

    /**
     * Get all banners with pagination (Admin only)
     * @param status Filter by status (optional)
     * @param pageable Pagination parameters
     * @return Page of banners
     */
    Page<BannerResponse> getAllBanners(BannerStatus status, Pageable pageable);

    /**
     * Get all active banners (Public - for customers)
     * @return List of active banners
     */
    List<BannerResponse> getActiveBanners();

    /**
     * Get banner by ID
     * @param bannerId Banner ID
     * @return Banner details
     */
    BannerResponse getBannerById(String bannerId);

    /**
     * Create new banner (Admin only)
     * @param request Banner creation details
     * @return Created banner
     */
    BannerResponse createBanner(BannerRequest request);

    /**
     * Update banner (Admin only)
     * @param bannerId Banner ID
     * @param request Banner update details
     * @return Updated banner
     */
    BannerResponse updateBanner(String bannerId, BannerRequest request);

    /**
     * Delete banner (Admin only)
     * @param bannerId Banner ID
     */
    void deleteBanner(String bannerId);

    /**
     * Activate banner (Admin only)
     * @param bannerId Banner ID
     * @return Updated banner
     */
    BannerResponse activateBanner(String bannerId);

    /**
     * Deactivate banner (Admin only)
     * @param bannerId Banner ID
     * @return Updated banner
     */
    BannerResponse deactivateBanner(String bannerId);
}
