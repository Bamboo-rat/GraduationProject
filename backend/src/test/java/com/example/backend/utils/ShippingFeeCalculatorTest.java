package com.example.backend.utils;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for ShippingFeeCalculator
 */
class ShippingFeeCalculatorTest {

    @Test
    void testCalculateDistance_SameLocation() {
        // Same location should return 0 distance
        double distance = LocationUtils.calculateDistance(
                10.762622, 106.660172,  // Ho Chi Minh City center
                10.762622, 106.660172   // Same location
        );
        assertEquals(0.0, distance, 0.01);
    }

    @Test
    void testCalculateDistance_ShortDistance() {
        // Distance from District 1 to District 3 in HCMC (~2km)
        double distance = LocationUtils.calculateDistance(
                10.762622, 106.660172,  // District 1
                10.783530, 106.687140   // District 3
        );
        assertTrue(distance > 0 && distance < 5, "Distance should be around 2-3 km");
    }

    @Test
    void testCalculateDistance_MediumDistance() {
        // Distance from District 1 to Thu Duc City (~15km)
        double distance = LocationUtils.calculateDistance(
                10.762622, 106.660172,  // District 1
                10.850000, 106.770000   // Thu Duc
        );
        assertTrue(distance > 10 && distance < 20, "Distance should be around 15 km");
    }

    @Test
    void testCalculateShippingFee_BaseDistance() {
        // Within 3km should return base fee (15,000 VND)
        BigDecimal fee = ShippingFeeCalculator.calculateShippingFee(
                10.762622, 106.660172,  // District 1
                10.770000, 106.670000   // ~1.5 km away
        );
        assertEquals(new BigDecimal("15000"), fee);
    }

    @Test
    void testCalculateShippingFee_ShortDistance() {
        // ~8km should be: 15,000 + (8-3)*5,000 = 15,000 + 25,000 = 40,000
        BigDecimal fee = ShippingFeeCalculator.calculateShippingFee(
                10.762622, 106.660172,  // District 1
                10.810000, 106.710000   // ~8 km away (actual distance)
        );
        assertTrue(fee.compareTo(new BigDecimal("38000")) >= 0 &&
                   fee.compareTo(new BigDecimal("45000")) <= 0,
                "Fee should be between 38,000 and 45,000 VND for ~8km");
    }

    @Test
    void testCalculateShippingFee_MediumDistance() {
        // 15km should be: 15,000 + (15-3)*5,000 = 15,000 + 60,000 = 75,000
        BigDecimal fee = ShippingFeeCalculator.calculateShippingFee(
                10.762622, 106.660172,  // District 1
                10.850000, 106.770000   // ~15 km away
        );
        assertTrue(fee.compareTo(new BigDecimal("60000")) >= 0 &&
                   fee.compareTo(new BigDecimal("80000")) <= 0,
                "Fee should be between 60,000 and 80,000 VND for ~15km");
    }

    @Test
    void testCalculateShippingFee_NullCoordinates() {
        // Null coordinates should return minimum fee
        BigDecimal fee = ShippingFeeCalculator.calculateShippingFee(
                null, 106.660172,
                10.770000, 106.670000
        );
        assertEquals(ShippingFeeCalculator.Config.getMinFee(), fee);
    }

    @Test
    void testCalculateShippingFee_InvalidCoordinates() {
        // Invalid latitude (>90) should return minimum fee
        BigDecimal fee = ShippingFeeCalculator.calculateShippingFee(
                100.0, 106.660172,  // Invalid latitude
                10.770000, 106.670000
        );
        assertEquals(ShippingFeeCalculator.Config.getMinFee(), fee);
    }

    @Test
    void testCalculateShippingFee_MaxFeeCap() {
        // Very long distance should be capped at max fee (100,000 VND)
        BigDecimal fee = ShippingFeeCalculator.calculateShippingFee(
                10.762622, 106.660172,  // Ho Chi Minh City
                21.028511, 105.804817   // Hanoi (~1000+ km)
        );
        assertEquals(ShippingFeeCalculator.Config.getMaxFee(), fee);
    }

    @Test
    void testRoundingToNearest1000() {
        // Fee should be rounded to nearest 1000 VND
        // Example: 5.5 km = 15,000 + 2.5*5,000 = 27,500 -> rounded to 28,000
        BigDecimal fee = ShippingFeeCalculator.calculateShippingFee(
                10.762622, 106.660172,
                10.815000, 106.715000  // ~5.5 km
        );
        // Check that fee is divisible by 1000
        assertTrue(fee.remainder(new BigDecimal("1000")).compareTo(BigDecimal.ZERO) == 0,
                "Fee should be rounded to nearest 1000 VND");
    }

    @Test
    void testConfigValues() {
        assertEquals(new BigDecimal("15000"), ShippingFeeCalculator.Config.getBaseFee());
        assertEquals(new BigDecimal("5000"), ShippingFeeCalculator.Config.getFeePerKm());
        assertEquals(3.0, ShippingFeeCalculator.Config.getBaseDistanceKm());
        assertEquals(new BigDecimal("100000"), ShippingFeeCalculator.Config.getMaxFee());
        assertEquals(new BigDecimal("15000"), ShippingFeeCalculator.Config.getMinFee());
    }
}
