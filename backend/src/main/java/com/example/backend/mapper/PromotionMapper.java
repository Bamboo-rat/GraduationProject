package com.example.backend.mapper;

import com.example.backend.dto.response.PromotionResponse;
import com.example.backend.entity.Promotion;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.time.LocalDate;
import java.util.List;

/**
 * MapStruct Mapper for Promotion entity to DTO conversion
 */
@Mapper(componentModel = "spring")
public interface PromotionMapper {

    /**
     * Convert Promotion entity to PromotionResponse DTO
     */
    @Mapping(target = "isActive", expression = "java(isPromotionActive(promotion))")
    @Mapping(target = "isExpired", expression = "java(isPromotionExpired(promotion))")
    @Mapping(target = "isHighlighted", source = "highlighted")
    PromotionResponse toResponse(Promotion promotion);

    /**
     * Convert list of Promotion entities to list of PromotionResponse DTOs
     */
    List<PromotionResponse> toResponseList(List<Promotion> promotions);

    /**
     * Check if promotion is active (valid dates + ACTIVE status)
     */
    default boolean isPromotionActive(Promotion promotion) {
        if (promotion == null) return false;
        LocalDate today = LocalDate.now();
        return promotion.getStatus() == com.example.backend.entity.enums.PromotionStatus.ACTIVE &&
               promotion.getStartDate() != null &&
               promotion.getEndDate() != null &&
               !promotion.getStartDate().isAfter(today) &&
               !promotion.getEndDate().isBefore(today);
    }

    /**
     * Check if promotion is expired (past end date)
     */
    default boolean isPromotionExpired(Promotion promotion) {
        if (promotion == null || promotion.getEndDate() == null) return false;
        return promotion.getEndDate().isBefore(LocalDate.now());
    }
}
