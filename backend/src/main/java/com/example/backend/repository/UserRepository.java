package com.example.backend.repository;

import com.example.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Optional<User> findByKeycloakId(String keycloakId);
    Optional<User> findByPhoneNumber(String phoneNumber);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    boolean existsByPhoneNumber(String phoneNumber);
    boolean existsByKeycloakId(String keycloakId);
    boolean existsByEmailAndKeycloakIdNot(String email, String keycloakId);
    
    /**
     * Insert customer if not exists using INSERT IGNORE to avoid optimistic locking issues.
     * This method is race-condition safe and will not throw exceptions on duplicate keycloakId.
     */
    @Modifying
    @Query(value = "INSERT IGNORE INTO customer (user_id, keycloak_id, email, full_name, username, is_active, status, version, created_at, updated_at) " +
                   "VALUES (:userId, :keycloakId, :email, :fullName, :username, true, 'ACTIVE', 0, NOW(), NOW())", 
           nativeQuery = true)
    void insertCustomerIfNotExists(
        @Param("userId") String userId,
        @Param("keycloakId") String keycloakId,
        @Param("email") String email,
        @Param("fullName") String fullName,
        @Param("username") String username
    );
}
