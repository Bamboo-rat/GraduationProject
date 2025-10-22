package com.example.backend.repository;

import com.example.backend.entity.Category;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, String> {

    Optional<Category> findByName(String name);

    boolean existsByName(String name);

    @Query("SELECT CASE WHEN COUNT(c) > 0 THEN true ELSE false END FROM Category c WHERE LOWER(c.name) = LOWER(:name)")
    boolean existsByNameIgnoreCase(@Param("name") String name);

    boolean existsByNameAndCategoryIdNot(String name, String categoryId);

    Page<Category> findByActiveTrue(Pageable pageable);

    Page<Category> findByActiveFalse(Pageable pageable);

    @Query("SELECT c FROM Category c WHERE " +
           "(:active IS NULL OR c.active = :active) AND " +
           "(:search IS NULL OR " +
           "LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(c.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Category> findByActiveAndSearch(
            @Param("active") Boolean active,
            @Param("search") String search,
            Pageable pageable
    );
}
