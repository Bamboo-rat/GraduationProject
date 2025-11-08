package com.example.backend.utils;

import lombok.extern.slf4j.Slf4j;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Utility class for calculating shipping fees based on distance.
 * Uses LocationUtils to calculate distance between two geographical coordinates.
 */
@Slf4j
public class ShippingFeeCalculator {

    // Shipping fee configuration (VND)
    private static final BigDecimal BASE_FEE = new BigDecimal("15000"); // Base fee for first 3km
    private static final BigDecimal FEE_PER_KM = new BigDecimal("5000"); // Additional fee per km after 3km
    private static final double BASE_DISTANCE_KM = 3.0; // Base distance covered by base fee
    private static final BigDecimal MAX_FEE = new BigDecimal("100000"); // Maximum shipping fee cap
    private static final BigDecimal MIN_FEE = new BigDecimal("15000"); // Minimum shipping fee

    /**
     * Calculate shipping fee based on distance between store and delivery address.
     *
     * @param storeLat Store latitude
     * @param storeLon Store longitude
     * @param addressLat Delivery address latitude
     * @param addressLon Delivery address longitude
     * @return Shipping fee in VND
     */
    public static BigDecimal calculateShippingFee(Double storeLat, Double storeLon, 
                                                   Double addressLat, Double addressLon) {
        // Validate coordinates
        if (storeLat == null || storeLon == null || addressLat == null || addressLon == null) {
            log.warn("Missing coordinates for shipping fee calculation. Returning minimum fee.");
            return MIN_FEE;
        }

        if (!isValidLatitude(storeLat) || !isValidLatitude(addressLat) ||
            !isValidLongitude(storeLon) || !isValidLongitude(addressLon)) {
            log.warn("Invalid coordinates: storeLat={}, storeLon={}, addressLat={}, addressLon={}. Returning minimum fee.",
                    storeLat, storeLon, addressLat, addressLon);
            return MIN_FEE;
        }

        // Calculate distance in kilometers using LocationUtils
        double distanceKm = LocationUtils.calculateDistance(storeLat, storeLon, addressLat, addressLon);
        log.info("Distance calculated: {} km", String.format("%.2f", distanceKm));

        // Calculate shipping fee based on distance
        BigDecimal shippingFee = calculateFeeByDistance(distanceKm);
        
        log.info("Shipping fee calculated: {} VND for distance {} km", shippingFee, String.format("%.2f", distanceKm));
        return shippingFee;
    }

    /**
     * Calculate shipping fee based on distance.
     * 
     * Pricing tiers:
     * - 0-3 km: Base fee (15,000 VND)
     * - 3-10 km: Base fee + 5,000 VND per km
     * - 10-20 km: Base fee + 5,000 VND per km (with discounted rate for bulk)
     * - 20+ km: Base fee + 5,000 VND per km (capped at MAX_FEE)
     *
     * @param distanceKm Distance in kilometers
     * @return Shipping fee in VND
     */
    private static BigDecimal calculateFeeByDistance(double distanceKm) {
        BigDecimal fee;

        if (distanceKm <= BASE_DISTANCE_KM) {
            // Within base distance: charge base fee
            fee = BASE_FEE;
        } else {
            // Beyond base distance: base fee + additional per km
            double additionalKm = distanceKm - BASE_DISTANCE_KM;
            BigDecimal additionalFee = FEE_PER_KM.multiply(
                BigDecimal.valueOf(additionalKm)
            ).setScale(0, RoundingMode.HALF_UP);
            
            fee = BASE_FEE.add(additionalFee);
        }

        // Apply minimum and maximum fee caps
        if (fee.compareTo(MIN_FEE) < 0) {
            fee = MIN_FEE;
        }
        if (fee.compareTo(MAX_FEE) > 0) {
            fee = MAX_FEE;
        }

        // Round to nearest 1000 VND for cleaner pricing
        fee = roundToNearest1000(fee);

        return fee;
    }

    /**
     * Round amount to nearest 1000 VND for cleaner pricing.
     *
     * @param amount Original amount
     * @return Rounded amount
     */
    private static BigDecimal roundToNearest1000(BigDecimal amount) {
        return amount.divide(new BigDecimal("1000"), 0, RoundingMode.HALF_UP)
                     .multiply(new BigDecimal("1000"));
    }

    /**
     * Validate latitude is within valid range [-90, 90].
     */
    private static boolean isValidLatitude(double latitude) {
        return latitude >= -90.0 && latitude <= 90.0;
    }

    /**
     * Validate longitude is within valid range [-180, 180].
     */
    private static boolean isValidLongitude(double longitude) {
        return longitude >= -180.0 && longitude <= 180.0;
    }

    /**
     * Get configuration for display purposes.
     */
    public static class Config {
        public static BigDecimal getBaseFee() {
            return BASE_FEE;
        }

        public static BigDecimal getFeePerKm() {
            return FEE_PER_KM;
        }

        public static double getBaseDistanceKm() {
            return BASE_DISTANCE_KM;
        }

        public static BigDecimal getMaxFee() {
            return MAX_FEE;
        }

        public static BigDecimal getMinFee() {
            return MIN_FEE;
        }
    }
}
