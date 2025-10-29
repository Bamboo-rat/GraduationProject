package com.example.backend.mapper;

import com.example.backend.dto.request.BannerRequest;
import com.example.backend.dto.response.BannerResponse;
import com.example.backend.entity.Banner;
import org.springframework.stereotype.Component;

/**
 * Mapper for Banner entity to DTO conversion
 */
@Component
public class BannerMapper {

    /**
     * Convert Banner entity to BannerResponse DTO
     */
    public BannerResponse toResponse(Banner banner) {
        if (banner == null) {
            return null;
        }

        return BannerResponse.builder()
                .bannerId(banner.getBannerId())
                .imageUrl(banner.getImageUrl())
                .title(banner.getTitle())
                .description(banner.getDescription())
                .linkUrl(banner.getLinkUrl())
                .status(banner.getStatus() != null ? banner.getStatus().name() : null)
                .createdAt(banner.getCreatedAt())
                .updatedAt(banner.getUpdatedAt())
                .build();
    }

    /**
     * Convert BannerRequest DTO to Banner entity (for creation)
     */
    public Banner toEntity(BannerRequest request) {
        if (request == null) {
            return null;
        }

        Banner banner = new Banner();
        banner.setImageUrl(request.getImageUrl());
        banner.setTitle(request.getTitle());
        banner.setDescription(request.getDescription());
        banner.setLinkUrl(request.getLinkUrl());
        banner.setStatus(request.getStatus());

        return banner;
    }

    /**
     * Update existing Banner entity with data from BannerRequest
     */
    public void updateEntity(Banner banner, BannerRequest request) {
        if (banner == null || request == null) {
            return;
        }

        banner.setImageUrl(request.getImageUrl());
        banner.setTitle(request.getTitle());
        banner.setDescription(request.getDescription());
        banner.setLinkUrl(request.getLinkUrl());
        banner.setStatus(request.getStatus());
    }
}
