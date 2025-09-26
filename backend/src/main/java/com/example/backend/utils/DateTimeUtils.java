package com.example.backend.utils;

import com.example.backend.entity.Customer;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;

public final class DateTimeUtils {

    private static final DateTimeFormatter VIETNAMESE_DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter VIETNAMESE_DATETIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy");

    private DateTimeUtils() {}

    /**
     * Định dạng một đối tượng LocalDate sang chuỗi String theo kiểu Việt Nam (dd/MM/yyyy).
     * @param date Ngày cần định dạng.
     * @return Chuỗi đã được định dạng, hoặc chuỗi rỗng nếu date là null.
     */
    public static String formatToVietnameseDate(LocalDate date) {
        if (date == null) {
            return "";
        }
        return date.format(VIETNAMESE_DATE_FORMATTER);
    }

    /**
     * Định dạng một đối tượng LocalDateTime sang chuỗi String theo kiểu Việt Nam (HH:mm dd/MM/yyyy).
     * @param dateTime Thời gian cần định dạng.
     * @return Chuỗi đã được định dạng, hoặc chuỗi rỗng nếu dateTime là null.
     */
    public static String formatToVietnameseDateTime(LocalDateTime dateTime) {
        if (dateTime == null) {
            return "";
        }
        return dateTime.format(VIETNAMESE_DATETIME_FORMATTER);
    }

    /**
     * Tính số ngày còn lại từ hôm nay đến một ngày hết hạn trong tương lai.
     * @param expiryDate Ngày hết hạn.
     * @return Số ngày còn lại. Trả về 0 nếu đã hết hạn hoặc ngày trong quá khứ.
     */
    public static long getDaysRemaining(LocalDate expiryDate) {
        if (expiryDate == null) {
            return 0;
        }
        LocalDate today = LocalDate.now();
        if (expiryDate.isBefore(today)) {
            return 0;
        }
        return ChronoUnit.DAYS.between(today, expiryDate);
    }

    /**
     * Kiểm tra xem một khách hàng có sinh nhật trong tháng hiện tại hay không.
     * @param customer Đối tượng khách hàng.
     * @return true nếu sinh nhật của khách hàng là trong tháng này, ngược lại là false.
     */
    public static boolean isBirthdayMonth(Customer customer) {
        if (customer == null || customer.getDateOfBirth() == null) {
            return false;
        }
        int currentMonth = LocalDate.now().getMonthValue();
        int birthMonth = customer.getDateOfBirth().getMonthValue();
        return currentMonth == birthMonth;
    }
}