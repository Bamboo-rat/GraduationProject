package com.example.backend.service;

import com.example.backend.dto.response.SystemConfigResponse;

import java.math.BigDecimal;
import java.util.List;

public interface SystemConfigService {

    /**
     * Get config value by key
     */
    String getConfigValue(String key);

    /**
     * Get config value as BigDecimal
     */
    BigDecimal getConfigValueAsDecimal(String key, BigDecimal defaultValue);

    /**
     * Get config value as Integer
     */
    Integer getConfigValueAsInteger(String key, Integer defaultValue);

    /**
     * Get config value as Boolean
     */
    Boolean getConfigValueAsBoolean(String key, Boolean defaultValue);

    /**
     * Update config value
     */
    SystemConfigResponse updateConfig(String key, String value, String updatedBy);

    /**
     * Get all configs
     */
    List<SystemConfigResponse> getAllConfigs();

    /**
     * Get all public configs (accessible by customers/suppliers)
     */
    List<SystemConfigResponse> getPublicConfigs();

    /**
     * Create or update config
     */
    SystemConfigResponse createOrUpdateConfig(String key, String value, String description, 
                                               String valueType, Boolean isPublic, String updatedBy);

    /**
     * Delete config by key
     */
    void deleteConfig(String key);
}
