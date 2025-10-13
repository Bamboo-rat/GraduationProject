package com.example.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * Configuration to enable JPA Auditing
 * This allows automatic population of @CreatedDate and @LastModifiedDate fields
 */
@Configuration
@EnableJpaAuditing
public class JpaAuditingConfig {
}
