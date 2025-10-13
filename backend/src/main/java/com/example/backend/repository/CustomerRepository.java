package com.example.backend.repository;

import com.example.backend.entity.Customer;
import com.example.backend.entity.enums.CustomerStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, String> {
    Optional<Customer> findByUsername(String username);
    Optional<Customer> findByEmail(String email);
    Optional<Customer> findByKeycloakId(String keycloakId);
    List<Customer> findByStatus(CustomerStatus status);
    
    /**
     * Find customers by status and created before a specific date
     * Used for cleanup old pending accounts
     */
    List<Customer> findByStatusAndCreatedAtBefore(CustomerStatus status, LocalDateTime createdAt);
}
