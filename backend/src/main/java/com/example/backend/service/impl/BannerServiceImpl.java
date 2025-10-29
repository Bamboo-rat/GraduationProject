package com.example.backend.service.impl;

import com.example.backend.dto.request.BannerRequest;
import com.example.backend.dto.response.BannerResponse;
import com.example.backend.entity.Banner;
import com.example.backend.entity.enums.BannerStatus;
import com.example.backend.exception.ErrorCode;
import com.example.backend.exception.custom.NotFoundException;
import com.example.backend.mapper.BannerMapper;
import com.example.backend.repository.BannerRepository;
import com.example.backend.service.BannerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Implementation of BannerService
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BannerServiceImpl implements BannerService {

    private final BannerRepository bannerRepository;
    private final BannerMapper bannerMapper;

    @Override
    @Transactional(readOnly = true)
    public Page<BannerResponse> getAllBanners(BannerStatus status, Pageable pageable) {
        log.info("Getting all banners with status filter: {}", status);

        Page<Banner> banners;
        if (status != null) {
            banners = bannerRepository.findByStatus(status, pageable);
        } else {
            banners = bannerRepository.findAll(pageable);
        }

        log.info("Found {} banners", banners.getTotalElements());
        return banners.map(bannerMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BannerResponse> getActiveBanners() {
        log.info("Getting all active banners for customers");

        List<Banner> activeBanners = bannerRepository.findByStatusOrderByCreatedAtDesc(BannerStatus.ACTIVE);

        log.info("Found {} active banners", activeBanners.size());
        return activeBanners.stream()
                .map(bannerMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public BannerResponse getBannerById(String bannerId) {
        log.info("Getting banner by ID: {}", bannerId);

        Banner banner = bannerRepository.findById(bannerId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.BANNER_NOT_FOUND,
                        "Banner not found with ID: " + bannerId));

        return bannerMapper.toResponse(banner);
    }

    @Override
    @Transactional
    public BannerResponse createBanner(BannerRequest request) {
        log.info("Creating new banner with title: {}", request.getTitle());

        Banner banner = bannerMapper.toEntity(request);
        banner = bannerRepository.save(banner);

        log.info("Banner created successfully with ID: {}", banner.getBannerId());
        return bannerMapper.toResponse(banner);
    }

    @Override
    @Transactional
    public BannerResponse updateBanner(String bannerId, BannerRequest request) {
        log.info("Updating banner: {}", bannerId);

        Banner banner = bannerRepository.findById(bannerId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.BANNER_NOT_FOUND,
                        "Banner not found with ID: " + bannerId));

        bannerMapper.updateEntity(banner, request);
        banner = bannerRepository.save(banner);

        log.info("Banner updated successfully: {}", bannerId);
        return bannerMapper.toResponse(banner);
    }

    @Override
    @Transactional
    public void deleteBanner(String bannerId) {
        log.info("Deleting banner: {}", bannerId);

        Banner banner = bannerRepository.findById(bannerId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.BANNER_NOT_FOUND,
                        "Banner not found with ID: " + bannerId));

        bannerRepository.delete(banner);
        log.info("Banner deleted successfully: {}", bannerId);
    }

    @Override
    @Transactional
    public BannerResponse activateBanner(String bannerId) {
        log.info("Activating banner: {}", bannerId);

        Banner banner = bannerRepository.findById(bannerId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.BANNER_NOT_FOUND,
                        "Banner not found with ID: " + bannerId));

        banner.setStatus(BannerStatus.ACTIVE);
        banner = bannerRepository.save(banner);

        log.info("Banner activated successfully: {}", bannerId);
        return bannerMapper.toResponse(banner);
    }

    @Override
    @Transactional
    public BannerResponse deactivateBanner(String bannerId) {
        log.info("Deactivating banner: {}", bannerId);

        Banner banner = bannerRepository.findById(bannerId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.BANNER_NOT_FOUND,
                        "Banner not found with ID: " + bannerId));

        banner.setStatus(BannerStatus.INACTIVE);
        banner = bannerRepository.save(banner);

        log.info("Banner deactivated successfully: {}", bannerId);
        return bannerMapper.toResponse(banner);
    }
}
