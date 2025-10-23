package com.example.backend.repository;

import com.example.backend.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    /**
     * Find token by token string
     */
    Optional<PasswordResetToken> findByToken(String token);

    /**
     * Find all tokens by keycloakId
     */
    List<PasswordResetToken> findByKeycloakId(String keycloakId);

    /**
     * Find valid (not used and not expired) tokens by keycloakId
     */
    @Query("SELECT t FROM PasswordResetToken t WHERE t.keycloakId = :keycloakId " +
           "AND t.used = false AND t.expiryDate > :now")
    List<PasswordResetToken> findValidTokensByKeycloakId(
            @Param("keycloakId") String keycloakId,
            @Param("now") LocalDateTime now);

    /**
     * Find all tokens by email
     */
    List<PasswordResetToken> findByEmail(String email);

    /**
     * Delete expired tokens
     */
    @Modifying
    @Query("DELETE FROM PasswordResetToken t WHERE t.expiryDate < :now")
    void deleteExpiredTokens(@Param("now") LocalDateTime now);

    /**
     * Invalidate all tokens for a keycloakId (mark as used)
     */
    @Modifying
    @Query("UPDATE PasswordResetToken t SET t.used = true, t.usedAt = :now " +
           "WHERE t.keycloakId = :keycloakId AND t.used = false")
    void invalidateAllTokensForUser(
            @Param("keycloakId") String keycloakId,
            @Param("now") LocalDateTime now);

    /**
     * Check if there's a valid token for keycloakId
     */
    @Query("SELECT COUNT(t) > 0 FROM PasswordResetToken t " +
           "WHERE t.keycloakId = :keycloakId AND t.used = false AND t.expiryDate > :now")
    boolean existsValidTokenForUser(
            @Param("keycloakId") String keycloakId,
            @Param("now") LocalDateTime now);
}
