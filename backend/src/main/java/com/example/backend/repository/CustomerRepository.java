package com.example.backend.repository;

import com.example.backend.entity.Customer;
import com.example.backend.entity.enums.CustomerStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, String> {
    Optional<Customer> findByUsername(String username);
    Optional<Customer> findByEmail(String email);
    Optional<Customer> findByKeycloakId(String keycloakId);
    List<Customer> findByStatus(CustomerStatus status);
}
