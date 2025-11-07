package com.example.backend.utils;

import com.example.backend.entity.Customer;
import com.example.backend.entity.enums.CustomerTier;

public final class CustomerTierUtils {

    private CustomerTierUtils() {}

    /**
     * Xác định hạng thành viên mới cho khách hàng dựa trên tổng số điểm tích lũy trọn đời.
     * Logic này tuân theo số điểm tối thiểu đã định nghĩa trong Enum CustomerTier.
     *
     * @param customer Đối tượng khách hàng cần được tính toán lại hạng.
     * @return Hạng thành viên mới (CustomerTier) mà khách hàng đạt được.
     */
    public static CustomerTier determineTier(Customer customer) {
        if (customer == null) {
            return CustomerTier.BRONZE;
        }

        int lifetimePoints = customer.getLifetimePoints();

        if (lifetimePoints >= CustomerTier.DIAMOND.getMinPoints()) {
            return CustomerTier.DIAMOND;
        }
        if (lifetimePoints >= CustomerTier.PLATINUM.getMinPoints()) {
            return CustomerTier.PLATINUM;
        }
        if (lifetimePoints >= CustomerTier.GOLD.getMinPoints()) {
            return CustomerTier.GOLD;
        }
        if (lifetimePoints >= CustomerTier.SILVER.getMinPoints()) {
            return CustomerTier.SILVER;
        }

        return CustomerTier.BRONZE;
    }

    /**
     * Calculate points required to reach next tier
     * 
     * @param currentTier Current customer tier
     * @param currentPoints Current points this year
     * @return Points needed for next tier (0 if already at max tier)
     */
    public static int getPointsRequiredForNextTier(CustomerTier currentTier, int currentPoints) {
        if (currentTier == null) {
            return CustomerTier.SILVER.getMinPoints();
        }

        CustomerTier nextTier = switch (currentTier) {
            case BRONZE -> CustomerTier.SILVER;
            case SILVER -> CustomerTier.GOLD;
            case GOLD -> CustomerTier.PLATINUM;
            case PLATINUM -> CustomerTier.DIAMOND;
            case DIAMOND -> null; // Already at max tier
        };

        if (nextTier == null) {
            return 0; // Already at maximum tier
        }

        int pointsNeeded = nextTier.getMinPoints() - currentPoints;
        return Math.max(0, pointsNeeded);
    }
}