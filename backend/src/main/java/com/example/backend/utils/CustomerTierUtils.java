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
}