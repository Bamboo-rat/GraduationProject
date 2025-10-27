package com.example.backend.repository;

import com.example.backend.entity.User;
import com.example.backend.entity.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
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
     * Find all users with specified roles
     * @param roles List of roles
     * @return List of users
     */
    @Query("SELECT u FROM User u WHERE u.role IN :roles AND u.active = true")
    List<User> findByRoleIn(@Param("roles") List<Role> roles);
}
