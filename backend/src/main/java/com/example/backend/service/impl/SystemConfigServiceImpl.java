package com.example.backend.service.impl;

import com.example.backend.dto.response.SystemConfigResponse;
import com.example.backend.entity.SystemConfig;
import com.example.backend.exception.ErrorCode;
import com.example.backend.exception.custom.NotFoundException;
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
