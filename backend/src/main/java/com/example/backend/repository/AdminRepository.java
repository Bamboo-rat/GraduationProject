package com.example.backend.repository;

import com.example.backend.entity.Admin;
import com.example.backend.entity.enums.AdminStatus;
import com.example.backend.entity.enums.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AdminRepository extends JpaRepository<Admin, String> {
    Optional<Admin> findByUsername(String username);
    Optional<Admin> findByEmail(String email);
    Optional<Admin> findByKeycloakId(String keycloakId);
    List<Admin> findByStatus(AdminStatus status);
    List<Admin> findByRole(Role role);
    
    // Pagination methods
    Page<Admin> findByRole(Role role, Pageable pageable);
    Page<Admin> findByStatus(AdminStatus status, Pageable pageable);
    Page<Admin> findByRoleAndStatus(Role role, AdminStatus status, Pageable pageable);
}
