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
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa cấu hình thành công"));
    }
}
