package com.example.backend.controller;

import com.example.backend.dto.request.UpdateSystemConfigRequest;
import com.example.backend.dto.response.ApiResponse;
import com.example.backend.dto.response.SystemConfigResponse;
import com.example.backend.service.SystemConfigService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/system-config")
@RequiredArgsConstructor
@Tag(name = "System Configuration", description = "System configuration management APIs")
@SecurityRequirement(name = "bearer-jwt")
public class SystemConfigController {

    private final SystemConfigService systemConfigService;

    @GetMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Get all system configs", description = "Get all system configuration settings (SUPER_ADMIN only)")
    public ResponseEntity<ApiResponse<List<SystemConfigResponse>>> getAllConfigs() {
        log.info("Request to get all system configs");
        List<SystemConfigResponse> configs = systemConfigService.getAllConfigs();
        return ResponseEntity.ok(ApiResponse.success(configs));
    }

    @GetMapping("/public")
    @Operation(summary = "Get public configs", description = "Get public configuration settings (no authentication required)")
    public ResponseEntity<ApiResponse<List<SystemConfigResponse>>> getPublicConfigs() {
        log.info("Request to get public configs");
        List<SystemConfigResponse> configs = systemConfigService.getPublicConfigs();
        return ResponseEntity.ok(ApiResponse.success(configs));
    }

    @GetMapping("/{key}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Get config by key", description = "Get configuration value by key (SUPER_ADMIN only)")
    public ResponseEntity<ApiResponse<String>> getConfigByKey(@PathVariable String key) {
        log.info("Request to get config by key: {}", key);
        String value = systemConfigService.getConfigValue(key);
        return ResponseEntity.ok(ApiResponse.success(value));
    }

    @PutMapping("/{key}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Update config", description = "Update system configuration (SUPER_ADMIN only)")
    public ResponseEntity<ApiResponse<SystemConfigResponse>> updateConfig(
            @PathVariable String key,
            @Valid @RequestBody UpdateSystemConfigRequest request,
            Authentication authentication) {
        log.info("Request to update config: key={}", key);
        
        String updatedBy = authentication.getName();
        SystemConfigResponse response = systemConfigService.updateConfig(
                key,
                request.getConfigValue(),
                updatedBy
        );
        
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Create or update config", description = "Create new or update existing configuration (SUPER_ADMIN only)")
    public ResponseEntity<ApiResponse<SystemConfigResponse>> createOrUpdateConfig(
            @Valid @RequestBody UpdateSystemConfigRequest request,
            @RequestParam(required = false) String valueType,
            @RequestParam(required = false, defaultValue = "false") Boolean isPublic,
            Authentication authentication) {
        log.info("Request to create/update config: key={}", request.getConfigKey());
        
        String updatedBy = authentication.getName();
        SystemConfigResponse response = systemConfigService.createOrUpdateConfig(
                request.getConfigKey(),
                request.getConfigValue(),
                request.getDescription(),
                valueType,
                isPublic,
                updatedBy
        );
        
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/{key}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Delete config", description = "Delete system configuration (SUPER_ADMIN only)")
    public ResponseEntity<ApiResponse<String>> deleteConfig(@PathVariable String key) {
        log.info("Request to delete config: key={}", key);
        systemConfigService.deleteConfig(key);
        return ResponseEntity.ok(ApiResponse.success("Xóa cấu hình thành công", null));
    }

    // Specialized endpoints for key system configurations

    @PutMapping("/commission-rate")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Update partner commission rate",
               description = "Update partner commission rate and sync to all suppliers (SUPER_ADMIN only)")
    public ResponseEntity<ApiResponse<SystemConfigResponse>> updateCommissionRate(
            @RequestParam java.math.BigDecimal commissionRate,
            Authentication authentication) {
        log.info("Request to update partner commission rate: {}%", commissionRate);

        String updatedBy = authentication.getName();
        SystemConfigResponse response = systemConfigService.updatePartnerCommissionRate(
                commissionRate,
                updatedBy
        );

        return ResponseEntity.ok(ApiResponse.success(
                "Cập nhật tỷ lệ hoa hồng thành công và đã đồng bộ đến tất cả nhà cung cấp",
                response));
    }

    @GetMapping("/commission-rate")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF')")
    @Operation(summary = "Get current commission rate",
               description = "Get current partner commission rate percentage (Admin only)")
    public ResponseEntity<ApiResponse<java.math.BigDecimal>> getCommissionRate() {
        log.info("Request to get current commission rate");
        java.math.BigDecimal rate = systemConfigService.getPartnerCommissionRate();
        return ResponseEntity.ok(ApiResponse.success(rate));
    }

    @PutMapping("/points-percentage")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Update points percentage",
               description = "Update points percentage per customer order (SUPER_ADMIN only)")
    public ResponseEntity<ApiResponse<SystemConfigResponse>> updatePointsPercentage(
            @RequestParam java.math.BigDecimal pointsPercentage,
            Authentication authentication) {
        log.info("Request to update points percentage: {}%", pointsPercentage);

        String updatedBy = authentication.getName();
        SystemConfigResponse response = systemConfigService.updatePointsPercentage(
                pointsPercentage,
                updatedBy
        );

        return ResponseEntity.ok(ApiResponse.success("Cập nhật tỷ lệ tích điểm thành công", response));
    }

    @GetMapping("/points-percentage")
    @Operation(summary = "Get current points percentage",
               description = "Get current points percentage per order (Public)")
    public ResponseEntity<ApiResponse<java.math.BigDecimal>> getPointsPercentage() {
        log.info("Request to get current points percentage");
        java.math.BigDecimal percentage = systemConfigService.getPointsPercentage();
        return ResponseEntity.ok(ApiResponse.success(percentage));
    }

    @PostMapping("/initialize")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Initialize default configs",
               description = "Initialize default system configurations (SUPER_ADMIN only)")
    public ResponseEntity<ApiResponse<String>> initializeDefaultConfigs() {
        log.info("Request to initialize default configs");
        systemConfigService.initializeDefaultConfigs();
        return ResponseEntity.ok(ApiResponse.success("Khởi tạo cấu hình mặc định thành công", null));
    }
}
