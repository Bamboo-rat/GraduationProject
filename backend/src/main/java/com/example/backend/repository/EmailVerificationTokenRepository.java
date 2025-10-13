package com.example.backend.repository;

import com.example.backend.entity.EmailVerificationToken;
import com.example.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, Long> {

    /**
     * Find token by token string
     *
     * @param token Token string
     * @return Optional EmailVerificationToken
     */
    Optional<EmailVerificationToken> findByToken(String token);

    /**
     * Find valid (not used and not expired) token by user
     *
     * @param user User entity
     * @return Optional EmailVerificationToken
     */
    Optional<EmailVerificationToken> findByUserAndUsedFalse(User user);

    /**
     * Find all tokens by user (used or not)
     *
     * @param user User entity
     * @return List of EmailVerificationToken
     */
    java.util.List<EmailVerificationToken> findByUser(User user);

    /**
     * Delete all tokens by user
     *
     * @param user User entity
     */
    void deleteByUser(User user);
}
