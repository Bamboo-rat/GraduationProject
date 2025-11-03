package com.example.backend.repository;

import com.example.backend.entity.Cart;
import com.example.backend.entity.CartDetail;
import com.example.backend.entity.StoreProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartDetailRepository extends JpaRepository<CartDetail, String> {

    /**
     * Find all cart details for a specific cart
     */
    List<CartDetail> findByCart(Cart cart);

    /**
     * Find cart detail by cart and store product
     */
    Optional<CartDetail> findByCartAndStoreProduct(Cart cart, StoreProduct storeProduct);

    /**
     * Delete all cart details for a specific cart
     */
    @Modifying
    @Query("DELETE FROM CartDetail cd WHERE cd.cart.cartId = :cartId")
    void deleteByCartId(@Param("cartId") String cartId);

    /**
     * Delete a specific cart detail
     */
    @Modifying
    @Query("DELETE FROM CartDetail cd WHERE cd.cartDetailId = :cartDetailId")
    void deleteByCartDetailId(@Param("cartDetailId") String cartDetailId);

    /**
     * Delete cart detail by cart and store product
     */
    @Modifying
    @Query("DELETE FROM CartDetail cd WHERE cd.cart.cartId = :cartId AND cd.storeProduct.storeProductId = :storeProductId")
    void deleteByCartIdAndStoreProductId(@Param("cartId") String cartId, @Param("storeProductId") String storeProductId);

    /**
     * Count cart details in a cart
     */
    long countByCart(Cart cart);

    /**
     * Check if cart detail exists for cart and store product
     */
    boolean existsByCartAndStoreProduct(Cart cart, StoreProduct storeProduct);
}
