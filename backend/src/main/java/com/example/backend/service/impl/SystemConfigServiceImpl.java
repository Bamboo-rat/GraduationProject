package com.example.backend.service.impl;

import com.example.backend.dto.response.SystemConfigResponse;
import com.example.backend.entity.Supplier;
import com.example.backend.entity.SystemConfig;
import com.example.backend.exception.ErrorCode;
import com.example.backend.exception.custom.BadRequestException;
import com.example.backend.exception.custom.NotFoundException;
import com.example.backend.repository.SupplierRepository;
import com.example.backend.repository.SystemConfigRepository;
import com.example.backend.service.SystemConfigService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SystemConfigServiceImpl implements SystemConfigService {

    private final SystemConfigRepository systemConfigRepository;
    private final SupplierRepository supplierRepository;

    // Config keys constants
    private static final String PARTNER_COMMISSION_RATE = "partner.commission.rate";
    private static final String POINTS_PERCENTAGE_PER_ORDER = "points.percentage.per.order";

    @Override
    @Cacheable(value = "systemConfig", key = "#key")
    public String getConfigValue(String key) {
        log.debug("Getting config value for key: {}", key);
        SystemConfig config = systemConfigRepository.findByConfigKey(key)
                .orElseThrow(() -> new NotFoundException(ErrorCode.RESOURCE_NOT_FOUND,
                        "Không tìm thấy cấu hình: " + key));
        return config.getConfigValue();
    }

    @Override
    public BigDecimal getConfigValueAsDecimal(String key, BigDecimal defaultValue) {
        try {
            String value = getConfigValue(key);
            return new BigDecimal(value);
        } catch (Exception e) {
            log.warn("Failed to get config {} as decimal, using default: {}", key, defaultValue);
            return defaultValue;
        }
    }

    @Override
    public Integer getConfigValueAsInteger(String key, Integer defaultValue) {
        try {
            String value = getConfigValue(key);
            return Integer.parseInt(value);
        } catch (Exception e) {
            log.warn("Failed to get config {} as integer, using default: {}", key, defaultValue);
            return defaultValue;
        }
    }

    @Override
    public Boolean getConfigValueAsBoolean(String key, Boolean defaultValue) {
        try {
            String value = getConfigValue(key);
            return Boolean.parseBoolean(value);
        } catch (Exception e) {
            log.warn("Failed to get config {} as boolean, using default: {}", key, defaultValue);
            return defaultValue;
        }
    }

    @Override
    @Transactional
    @CacheEvict(value = "systemConfig", key = "#key")
    public SystemConfigResponse updateConfig(String key, String value, String updatedBy) {
        log.info("Updating config: key={}, value={}, updatedBy={}", key, value, updatedBy);

        SystemConfig config = systemConfigRepository.findByConfigKey(key)
                .orElseThrow(() -> new NotFoundException(ErrorCode.RESOURCE_NOT_FOUND,
                        "Không tìm thấy cấu hình: " + key));

        config.setConfigValue(value);
        config.setUpdatedBy(updatedBy);
        config = systemConfigRepository.save(config);

        log.info("Config updated successfully: key={}", key);
        return mapToResponse(config);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SystemConfigResponse> getAllConfigs() {
        log.debug("Getting all configs");
        return systemConfigRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<SystemConfigResponse> getPublicConfigs() {
        log.debug("Getting public configs");
        return systemConfigRepository.findByIsPublicTrue().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    @CacheEvict(value = "systemConfig", key = "#key")
    public SystemConfigResponse createOrUpdateConfig(String key, String value, String description,
                                                      String valueType, Boolean isPublic, String updatedBy) {
        log.info("Creating or updating config: key={}", key);

        SystemConfig config = systemConfigRepository.findByConfigKey(key)
                .orElseGet(() -> {
                    SystemConfig newConfig = new SystemConfig();
                    newConfig.setConfigKey(key);
                    return newConfig;
                });

        config.setConfigValue(value);
        config.setDescription(description);
        config.setValueType(valueType != null ? valueType : "STRING");
        config.setIsPublic(isPublic != null ? isPublic : false);
        config.setUpdatedBy(updatedBy);

        config = systemConfigRepository.save(config);
        log.info("Config saved successfully: key={}", key);
        return mapToResponse(config);
    }

    @Override
    @Transactional
    @CacheEvict(value = "systemConfig", key = "#key")
    public void deleteConfig(String key) {
        log.info("Deleting config: key={}", key);

        SystemConfig config = systemConfigRepository.findByConfigKey(key)
                .orElseThrow(() -> new NotFoundException(ErrorCode.RESOURCE_NOT_FOUND,
                        "Không tìm thấy cấu hình: " + key));

        systemConfigRepository.delete(config);
        log.info("Config deleted successfully: key={}", key);
    }

    @Override
    @Transactional
    @CacheEvict(value = "systemConfig", key = "'" + PARTNER_COMMISSION_RATE + "'")
    public SystemConfigResponse updatePartnerCommissionRate(BigDecimal commissionRate, String updatedBy) {
        log.info("Updating partner commission rate to: {}% by: {}", commissionRate, updatedBy);

        // Validate commission rate (0-100%)
        if (commissionRate.compareTo(BigDecimal.ZERO) < 0 || commissionRate.compareTo(new BigDecimal("100")) > 0) {
            throw new BadRequestException(ErrorCode.INVALID_REQUEST, "Tỷ lệ hoa hồng phải trong khoảng 0-100%");
        }

        // Convert percentage to decimal (e.g., 10% -> 0.10)
        BigDecimal decimalRate = commissionRate.divide(new BigDecimal("100"));

        // Update system config
        SystemConfigResponse response = createOrUpdateConfig(
                PARTNER_COMMISSION_RATE,
                decimalRate.toString(),
                "Tỷ lệ hoa hồng cho đối tác (%) - được tính trên mỗi đơn hàng",
                "NUMBER",
                false,
                updatedBy
        );

        // Sync to all active suppliers
        syncCommissionRateToSuppliers(decimalRate.doubleValue());

        log.info("Partner commission rate updated and synced to all suppliers successfully");
        return response;
    }

    @Override
    @Transactional
    @CacheEvict(value = "systemConfig", key = "'" + POINTS_PERCENTAGE_PER_ORDER + "'")
    public SystemConfigResponse updatePointsPercentage(BigDecimal pointsPercentage, String updatedBy) {
        log.info("Updating points percentage per order to: {}% by: {}", pointsPercentage, updatedBy);

        // Validate points percentage (0-100%)
        if (pointsPercentage.compareTo(BigDecimal.ZERO) < 0 || pointsPercentage.compareTo(new BigDecimal("100")) > 0) {
            throw new BadRequestException(ErrorCode.INVALID_REQUEST, "Tỷ lệ tích điểm phải trong khoảng 0-100%");
        }

        // Convert percentage to decimal (e.g., 5% -> 0.05)
        BigDecimal decimalRate = pointsPercentage.divide(new BigDecimal("100"));

        SystemConfigResponse response = createOrUpdateConfig(
                POINTS_PERCENTAGE_PER_ORDER,
                decimalRate.toString(),
                "Tỷ lệ tích điểm cho khách hàng (%) - dựa trên giá trị đơn hàng",
                "NUMBER",
                true, // Public so customers can see
                updatedBy
        );

        log.info("Points percentage updated successfully");
        return response;
    }

    @Override
    public BigDecimal getPartnerCommissionRate() {
        try {
            String value = getConfigValue(PARTNER_COMMISSION_RATE);
            // Return as percentage (0.10 -> 10)
            return new BigDecimal(value).multiply(new BigDecimal("100"));
        } catch (NotFoundException e) {
            log.warn("Commission rate not found, returning default 10%");
            return new BigDecimal("10");
        }
    }

    @Override
    public BigDecimal getPointsPercentage() {
        try {
            String value = getConfigValue(POINTS_PERCENTAGE_PER_ORDER);
            // Return as percentage (0.05 -> 5)
            return new BigDecimal(value).multiply(new BigDecimal("100"));
        } catch (NotFoundException e) {
            log.warn("Points percentage not found, returning default 5%");
            return new BigDecimal("5");
        }
    }

    @Override
    @Transactional
    public void initializeDefaultConfigs() {
        log.info("Initializing default system configs");

        // Initialize commission rate if not exists
        if (systemConfigRepository.findByConfigKey(PARTNER_COMMISSION_RATE).isEmpty()) {
            SystemConfig commissionConfig = new SystemConfig();
            commissionConfig.setConfigKey(PARTNER_COMMISSION_RATE);
            commissionConfig.setConfigValue("0.10"); // 10% default
            commissionConfig.setDescription("Tỷ lệ hoa hồng cho đối tác (%) - được tính trên mỗi đơn hàng");
            commissionConfig.setValueType("NUMBER");
            commissionConfig.setIsPublic(false);
            commissionConfig.setUpdatedBy("SYSTEM");
            systemConfigRepository.save(commissionConfig);
            log.info("Initialized default partner commission rate: 10%");
        }

        // Initialize points percentage if not exists
        if (systemConfigRepository.findByConfigKey(POINTS_PERCENTAGE_PER_ORDER).isEmpty()) {
            SystemConfig pointsConfig = new SystemConfig();
            pointsConfig.setConfigKey(POINTS_PERCENTAGE_PER_ORDER);
            pointsConfig.setConfigValue("0.05"); // 5% default
            pointsConfig.setDescription("Tỷ lệ tích điểm cho khách hàng (%) - dựa trên giá trị đơn hàng");
            pointsConfig.setValueType("NUMBER");
            pointsConfig.setIsPublic(true);
            pointsConfig.setUpdatedBy("SYSTEM");
            systemConfigRepository.save(pointsConfig);
            log.info("Initialized default points percentage: 5%");
        }

        log.info("Default system configs initialized successfully");
    }

    /**
     * Sync commission rate to all suppliers
     */
    private void syncCommissionRateToSuppliers(Double newCommissionRate) {
        log.info("Syncing commission rate to all suppliers: {}", newCommissionRate);

        List<Supplier> suppliers = supplierRepository.findAll();
        int updatedCount = 0;

        for (Supplier supplier : suppliers) {
            supplier.setCommissionRate(newCommissionRate);
            updatedCount++;
        }

        if (updatedCount > 0) {
            supplierRepository.saveAll(suppliers);
            log.info("Successfully synced commission rate to {} suppliers", updatedCount);
        } else {
            log.info("No suppliers found to sync commission rate");
        }
    }

    // Helper methods

    private SystemConfigResponse mapToResponse(SystemConfig config) {
        return SystemConfigResponse.builder()
                .configKey(config.getConfigKey())
                .configValue(config.getConfigValue())
                .description(config.getDescription())
                .valueType(config.getValueType())
                .isPublic(config.getIsPublic())
                .createdAt(config.getCreatedAt())
                .updatedAt(config.getUpdatedAt())
                .updatedBy(config.getUpdatedBy())
                .build();
    }
}
