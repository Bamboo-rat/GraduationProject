package com.example.backend.repository;

import com.example.backend.entity.Cart;
import com.example.backend.entity.CartPromotion;
import com.example.backend.entity.Promotion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartPromotionRepository extends JpaRepository<CartPromotion, String> {

    /**
     * Find all promotions applied to a cart
     */
    List<CartPromotion> findByCart(Cart cart);

    /**
     * Find cart promotion by cart and promotion
     */
    Optional<CartPromotion> findByCartAndPromotion(Cart cart, Promotion promotion);

    /**
     * Delete all promotions for a cart
     */
    @Modifying
    @Query("DELETE FROM CartPromotion cp WHERE cp.cart.cartId = :cartId")
    void deleteByCartId(@Param("cartId") String cartId);

    /**
     * Check if promotion is already applied to cart
     */
    boolean existsByCartAndPromotion(Cart cart, Promotion promotion);

    /**
     * Count promotions applied to cart
     */
    long countByCart(Cart cart);
}
