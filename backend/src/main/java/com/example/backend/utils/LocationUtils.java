package com.example.backend.utils;

public final class LocationUtils {

    // Bán kính trung bình của Trái Đất theo đơn vị kilomet
    private static final int EARTH_RADIUS_KM = 6371;

    /**
     * Constructor private để ngăn việc tạo đối tượng từ một lớp tiện ích.
     */
    private LocationUtils() {}

    /**
     * Tính toán khoảng cách "đường chim bay" giữa hai điểm tọa độ (lat, lon)
     * sử dụng công thức Haversine.
     *
     * @param lat1 Vĩ độ của điểm 1
     * @param lon1 Kinh độ của điểm 1
     * @param lat2 Vĩ độ của điểm 2
     * @param lon2 Kinh độ của điểm 2
     * @return Khoảng cách giữa hai điểm theo đơn vị kilomet.
     */
    public static double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        // Chuyển đổi từ độ sang radian
        double lat1Rad = Math.toRadians(lat1);
        double lon1Rad = Math.toRadians(lon1);
        double lat2Rad = Math.toRadians(lat2);
        double lon2Rad = Math.toRadians(lon2);

        // Tính chênh lệch vĩ độ và kinh độ
        double dLat = lat2Rad - lat1Rad;
        double dLon = lon2Rad - lon1Rad;

        // Áp dụng công thức Haversine
        double a = Math.pow(Math.sin(dLat / 2), 2)
                + Math.cos(lat1Rad) * Math.cos(lat2Rad)
                * Math.pow(Math.sin(dLon / 2), 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return EARTH_RADIUS_KM * c;
    }
}