package com.example.backend.repository;

import com.example.backend.entity.SystemConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SystemConfigRepository extends JpaRepository<SystemConfig, String> {

    /**
     * Find config by key
     */
    Optional<SystemConfig> findByConfigKey(String configKey);

    /**
     * Find all public configs (can be exposed to frontend)
     */
    List<SystemConfig> findByIsPublicTrue();

    /**
     * Check if config key exists
     */
    boolean existsByConfigKey(String configKey);
}
