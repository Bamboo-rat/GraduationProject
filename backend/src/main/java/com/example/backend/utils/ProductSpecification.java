package com.example.backend.utils;

import com.example.backend.dto.request.ProductFilterRequest;
import com.example.backend.entity.Product;
import com.example.backend.entity.ProductVariant;
import com.example.backend.entity.Store;
import com.example.backend.entity.StoreProduct;
import jakarta.persistence.criteria.*;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * JPA Specification for dynamic product filtering with shopping features
 */
public class ProductSpecification {

    /**
     * Build specification from filter request
     */
    public static Specification<Product> buildSpecification(ProductFilterRequest filter) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Filter by status
            if (filter.getStatus() != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), filter.getStatus()));
            }

            // 2. Filter by category
            if (filter.getCategoryId() != null) {
                predicates.add(criteriaBuilder.equal(root.get("category").get("categoryId"), filter.getCategoryId()));
            }

            // 3. Filter by supplier
            if (filter.getSupplierId() != null) {
                predicates.add(criteriaBuilder.equal(root.get("supplier").get("userId"), filter.getSupplierId()));
            }

            // CRITICAL FIX: Only show products from ACTIVE suppliers
            // This ensures that when supplier pauses/suspends, their products are hidden from customers
            predicates.add(criteriaBuilder.equal(root.get("supplier").get("status"), 
                    com.example.backend.entity.enums.SupplierStatus.ACTIVE));

            // 4. Search by keyword in product name or description
            if (filter.getSearch() != null && !filter.getSearch().trim().isEmpty()) {
                String searchPattern = "%" + filter.getSearch().toLowerCase() + "%";
                Predicate namePredicate = criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("name")), searchPattern);
                Predicate descPredicate = criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("description")), searchPattern);
                predicates.add(criteriaBuilder.or(namePredicate, descPredicate));
            }

            // 5. Filter by price range (at variant level)
            if (filter.getMinPrice() != null || filter.getMaxPrice() != null) {
                Subquery<String> priceSubquery = query.subquery(String.class);
                Root<ProductVariant> variantRoot = priceSubquery.from(ProductVariant.class);
                priceSubquery.select(variantRoot.get("product").get("productId"));

                List<Predicate> pricePredicates = new ArrayList<>();

                // Use discountPrice if available, otherwise originalPrice
                Expression<BigDecimal> effectivePrice = criteriaBuilder.coalesce(
                        variantRoot.get("discountPrice"),
                        variantRoot.get("originalPrice")
                );

                if (filter.getMinPrice() != null) {
                    pricePredicates.add(criteriaBuilder.greaterThanOrEqualTo(
                            effectivePrice, filter.getMinPrice()));
                }
                if (filter.getMaxPrice() != null) {
                    pricePredicates.add(criteriaBuilder.lessThanOrEqualTo(
                            effectivePrice, filter.getMaxPrice()));
                }

                priceSubquery.where(
                        criteriaBuilder.and(
                                criteriaBuilder.equal(variantRoot.get("product"), root),
                                criteriaBuilder.and(pricePredicates.toArray(new Predicate[0]))
                        )
                );

                predicates.add(criteriaBuilder.exists(priceSubquery));
            }

            // 6. Filter by expiry date range
            if (filter.getExpiryDateFrom() != null || filter.getExpiryDateTo() != null) {
                Subquery<String> expirySubquery = query.subquery(String.class);
                Root<ProductVariant> variantRoot = expirySubquery.from(ProductVariant.class);
                expirySubquery.select(variantRoot.get("product").get("productId"));

                List<Predicate> expiryPredicates = new ArrayList<>();

                if (filter.getExpiryDateFrom() != null) {
                    expiryPredicates.add(criteriaBuilder.greaterThanOrEqualTo(
                            variantRoot.get("expiryDate"), filter.getExpiryDateFrom()));
                }
                if (filter.getExpiryDateTo() != null) {
                    expiryPredicates.add(criteriaBuilder.lessThanOrEqualTo(
                            variantRoot.get("expiryDate"), filter.getExpiryDateTo()));
                }

                expirySubquery.where(
                        criteriaBuilder.and(
                                criteriaBuilder.equal(variantRoot.get("product"), root),
                                criteriaBuilder.and(expiryPredicates.toArray(new Predicate[0])),
                                criteriaBuilder.isNotNull(variantRoot.get("expiryDate"))
                        )
                );

                predicates.add(criteriaBuilder.exists(expirySubquery));
            }

            // 7. Filter by expiring within X days
            if (filter.getExpiringWithinDays() != null) {
                LocalDate today = LocalDate.now();
                LocalDate futureDate = today.plusDays(filter.getExpiringWithinDays());

                Subquery<String> expirySubquery = query.subquery(String.class);
                Root<ProductVariant> variantRoot = expirySubquery.from(ProductVariant.class);
                expirySubquery.select(variantRoot.get("product").get("productId"));

                expirySubquery.where(
                        criteriaBuilder.and(
                                criteriaBuilder.equal(variantRoot.get("product"), root),
                                criteriaBuilder.between(variantRoot.get("expiryDate"), today, futureDate),
                                criteriaBuilder.isNotNull(variantRoot.get("expiryDate"))
                        )
                );

                predicates.add(criteriaBuilder.exists(expirySubquery));
            }

            // 8. Filter by location (province, district, ward)
            if (filter.getProvince() != null || filter.getDistrict() != null || filter.getWard() != null) {
                Subquery<String> locationSubquery = query.subquery(String.class);
                Root<ProductVariant> variantRoot = locationSubquery.from(ProductVariant.class);
                Join<ProductVariant, StoreProduct> storeProductJoin = variantRoot.join("storeProducts");
                Join<StoreProduct, Store> storeJoin = storeProductJoin.join("store");

                locationSubquery.select(variantRoot.get("product").get("productId"));

                List<Predicate> locationPredicates = new ArrayList<>();
                locationPredicates.add(criteriaBuilder.equal(variantRoot.get("product"), root));

                if (filter.getProvince() != null) {
                    locationPredicates.add(criteriaBuilder.equal(
                            criteriaBuilder.lower(storeJoin.get("province")),
                            filter.getProvince().toLowerCase()));
                }
                if (filter.getDistrict() != null) {
                    locationPredicates.add(criteriaBuilder.equal(
                            criteriaBuilder.lower(storeJoin.get("district")),
                            filter.getDistrict().toLowerCase()));
                }
                if (filter.getWard() != null) {
                    locationPredicates.add(criteriaBuilder.equal(
                            criteriaBuilder.lower(storeJoin.get("ward")),
                            filter.getWard().toLowerCase()));
                }

                locationSubquery.where(criteriaBuilder.and(locationPredicates.toArray(new Predicate[0])));
                predicates.add(criteriaBuilder.exists(locationSubquery));
            }

            // 9. Filter by distance (using Haversine formula)
            if (filter.getUserLatitude() != null && filter.getUserLongitude() != null && filter.getMaxDistanceKm() != null) {
                Subquery<String> distanceSubquery = query.subquery(String.class);
                Root<ProductVariant> variantRoot = distanceSubquery.from(ProductVariant.class);
                Join<ProductVariant, StoreProduct> storeProductJoin = variantRoot.join("storeProducts");
                Join<StoreProduct, Store> storeJoin = storeProductJoin.join("store");

                distanceSubquery.select(variantRoot.get("product").get("productId"));

                // Haversine formula for distance calculation in kilometers
                // distance = 6371 * 2 * ASIN(SQRT(POWER(SIN((lat1 - lat2) * pi()/180 / 2), 2) +
                //            COS(lat1 * pi()/180) * COS(lat2 * pi()/180) *
                //            POWER(SIN((lon1 - lon2) * pi()/180 / 2), 2)))

                double userLat = filter.getUserLatitude();
                double userLon = filter.getUserLongitude();
                double maxDistance = filter.getMaxDistanceKm();

                // Convert to radians
                Expression<Double> lat1Rad = criteriaBuilder.prod(
                        criteriaBuilder.literal(userLat),
                        criteriaBuilder.quot(criteriaBuilder.literal(Math.PI), criteriaBuilder.literal(180.0))
                ).as(Double.class);

                Expression<Double> lat2Rad = criteriaBuilder.prod(
                        storeJoin.get("latitude").as(Double.class),
                        criteriaBuilder.quot(criteriaBuilder.literal(Math.PI), criteriaBuilder.literal(180.0))
                ).as(Double.class);

                Expression<Double> lon1Rad = criteriaBuilder.prod(
                        criteriaBuilder.literal(userLon),
                        criteriaBuilder.quot(criteriaBuilder.literal(Math.PI), criteriaBuilder.literal(180.0))
                ).as(Double.class);

                Expression<Double> lon2Rad = criteriaBuilder.prod(
                        storeJoin.get("longitude").as(Double.class),
                        criteriaBuilder.quot(criteriaBuilder.literal(Math.PI), criteriaBuilder.literal(180.0))
                ).as(Double.class);

                // Calculate differences
                Expression<Double> latDiff = criteriaBuilder.diff(lat2Rad, lat1Rad).as(Double.class);
                Expression<Double> lonDiff = criteriaBuilder.diff(lon2Rad, lon1Rad).as(Double.class);

                // Haversine calculation
                Expression<Double> sinLatHalf = criteriaBuilder.function("SIN", Double.class,
                        criteriaBuilder.quot(latDiff, criteriaBuilder.literal(2.0)).as(Double.class));

                Expression<Double> sinLonHalf = criteriaBuilder.function("SIN", Double.class,
                        criteriaBuilder.quot(lonDiff, criteriaBuilder.literal(2.0)).as(Double.class));

                Expression<Double> cosLat1 = criteriaBuilder.function("COS", Double.class, lat1Rad);
                Expression<Double> cosLat2 = criteriaBuilder.function("COS", Double.class, lat2Rad);

                Expression<Double> a = criteriaBuilder.sum(
                        criteriaBuilder.prod(sinLatHalf, sinLatHalf).as(Double.class),
                        criteriaBuilder.prod(
                                criteriaBuilder.prod(cosLat1, cosLat2).as(Double.class),
                                criteriaBuilder.prod(sinLonHalf, sinLonHalf).as(Double.class)
                        ).as(Double.class)
                ).as(Double.class);

                Expression<Double> c = criteriaBuilder.prod(
                        criteriaBuilder.literal(2.0),
                        criteriaBuilder.function("ASIN", Double.class,
                                criteriaBuilder.function("SQRT", Double.class, a))
                ).as(Double.class);

                Expression<Double> distance = criteriaBuilder.prod(
                        criteriaBuilder.literal(6371.0), c
                ).as(Double.class);

                distanceSubquery.where(
                        criteriaBuilder.and(
                                criteriaBuilder.equal(variantRoot.get("product"), root),
                                criteriaBuilder.lessThanOrEqualTo(distance, maxDistance)
                        )
                );

                predicates.add(criteriaBuilder.exists(distanceSubquery));
            }

            // Combine all predicates with AND
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }

    /**
     * Helper method to calculate distance between two coordinates
     * Used for verification and testing
     */
    public static double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int EARTH_RADIUS_KM = 6371;

        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);

        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);

        double c = 2 * Math.asin(Math.sqrt(a));

        return EARTH_RADIUS_KM * c;
    }
}
