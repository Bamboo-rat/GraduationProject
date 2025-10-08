package com.example.backend.repository;

import com.example.backend.entity.Supplier;
import com.example.backend.entity.enums.SupplierStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, String> {
    Optional<Supplier> findByUsername(String username);
    Optional<Supplier> findByEmail(String email);
    Optional<Supplier> findByKeycloakId(String keycloakId);
    List<Supplier> findByStatus(SupplierStatus status);
    Optional<Supplier> findByBusinessLicense(String businessLicense);
    Optional<Supplier> findByTaxCode(String taxCode);
}
