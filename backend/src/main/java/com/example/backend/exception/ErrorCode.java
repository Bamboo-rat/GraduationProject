package com.example.backend.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {

    // ===== 1xxx: General & Validation Errors =====
    VALIDATION_ERROR("1001", "Validation failed", "Lỗi xác thực dữ liệu không hợp lệ", HttpStatus.BAD_REQUEST),
    INVALID_REQUEST("1002", "Invalid request data", "Dữ liệu yêu cầu không hợp lệ", HttpStatus.BAD_REQUEST),
    RESOURCE_NOT_FOUND("1003", "Resource not found", "Không tìm thấy tài nguyên được yêu cầu", HttpStatus.NOT_FOUND),

    // ===== 2xxx: Authentication & Authorization Errors =====
    UNAUTHENTICATED("2001", "Unauthenticated", "Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED("2002", "Forbidden", "Bạn không có quyền thực hiện hành động này", HttpStatus.FORBIDDEN),
    TOKEN_INVALID("2003", "Invalid token", "Token không hợp lệ hoặc đã hết hạn", HttpStatus.UNAUTHORIZED),
    ACCOUNT_LOCKED("2004", "Account is locked", "Tài khoản của bạn đã bị khóa", HttpStatus.FORBIDDEN),
    ACCOUNT_INACTIVE("2005", "Account is inactive", "Tài khoản của bạn chưa được kích hoạt", HttpStatus.FORBIDDEN),

    // ===== 3xxx: User, Customer, Supplier Errors =====
    USER_NOT_FOUND("3001", "User not found", "Không tìm thấy người dùng", HttpStatus.NOT_FOUND),
    EMAIL_ALREADY_EXISTS("3002", "Email already exists", "Email này đã được sử dụng", HttpStatus.CONFLICT),
    USERNAME_ALREADY_EXISTS("3003", "Username already exists", "Tên đăng nhập này đã được sử dụng", HttpStatus.CONFLICT),
    SUPPLIER_NOT_APPROVED("3004", "Supplier not yet approved", "Tài khoản nhà cung cấp của bạn chưa được duyệt", HttpStatus.FORBIDDEN),

    // ===== 4xxx: Product & Category Errors =====
    PRODUCT_NOT_FOUND("4001", "Product not found", "Không tìm thấy sản phẩm", HttpStatus.NOT_FOUND),
    CATEGORY_NOT_FOUND("4002", "Category not found", "Không tìm thấy danh mục sản phẩm", HttpStatus.NOT_FOUND),
    PRODUCT_OUT_OF_STOCK("4003", "Product is out of stock", "Sản phẩm đã hết hàng", HttpStatus.BAD_REQUEST),
    INVALID_EXPIRY_DATE("4004", "Invalid expiry date", "Ngày hết hạn của sản phẩm không hợp lệ", HttpStatus.BAD_REQUEST),

    // ===== 5xxx: Cart, Order, Payment, Promotion Errors =====
    ORDER_NOT_FOUND("5001", "Order not found", "Không tìm thấy đơn hàng", HttpStatus.NOT_FOUND),
    CART_NOT_FOUND("5002", "Cart not found", "Không tìm thấy giỏ hàng", HttpStatus.NOT_FOUND),
    PROMOTION_NOT_FOUND("5003", "Promotion code not found", "Không tìm thấy mã khuyến mãi", HttpStatus.NOT_FOUND),
    PROMOTION_EXPIRED_OR_INACTIVE("5004", "Promotion is expired or inactive", "Mã khuyến mãi đã hết hạn hoặc không hoạt động", HttpStatus.BAD_REQUEST),
    PROMOTION_NOT_APPLICABLE("5005", "Promotion is not applicable for this order", "Mã khuyến mãi không áp dụng cho đơn hàng này", HttpStatus.BAD_REQUEST),
    PAYMENT_FAILED("5006", "Payment processing failed", "Quá trình thanh toán thất bại", HttpStatus.BAD_REQUEST),
    CANNOT_CANCEL_ORDER("5007", "Order cannot be canceled", "Không thể hủy đơn hàng đã được vận chuyển", HttpStatus.BAD_REQUEST),

    // ===== 9xxx: Internal/Server Errors =====
    INTERNAL_SERVER_ERROR("9998", "An internal server error occurred", "Đã có lỗi xảy ra ở phía máy chủ", HttpStatus.INTERNAL_SERVER_ERROR),
    DATABASE_ERROR("9999", "Database error occurred", "Đã có lỗi xảy ra với cơ sở dữ liệu", HttpStatus.INTERNAL_SERVER_ERROR),

    // Keycloak errors (3000-3999)
    KEYCLOAK_USER_CREATION_FAILED("K3000", "Failed to create user in Keycloak", "Tạo tài khoản người dùng thất bại", HttpStatus.INTERNAL_SERVER_ERROR),
    KEYCLOAK_USER_UPDATE_FAILED("K3001", "Failed to update user in Keycloak", "Cập nhật tài khoản người dùng thất bại", HttpStatus.INTERNAL_SERVER_ERROR),
    KEYCLOAK_USER_DELETION_FAILED("K3002", "Failed to delete user in Keycloak", "Xóa tài khoản người dùng thất bại", HttpStatus.INTERNAL_SERVER_ERROR),
    KEYCLOAK_CONNECTION_ERROR("K3003", "Cannot connect to Keycloak", "Không thể kết nối đến Keycloak", HttpStatus.SERVICE_UNAVAILABLE),
    KEYCLOAK_ROLE_ASSIGNMENT_FAILED("K3004", "Failed to assign role to user in Keycloak", "Gán quyền cho người dùng thất bại", HttpStatus.INTERNAL_SERVER_ERROR),
    KEYCLOAK_AUTHENTICATION_FAILED("K3005", "Authentication failed", "Đăng nhập thất bại", HttpStatus.UNAUTHORIZED),
    KEYCLOAK_USER_NOT_FOUND("K3006", "User not found in Keycloak", "Không tìm thấy người dùng trong Keycloak", HttpStatus.NOT_FOUND),
    KEYCLOAK_PASSWORD_UPDATE_FAILED("K3007", "Failed to update password in Keycloak", "Cập nhật mật khẩu thất bại", HttpStatus.INTERNAL_SERVER_ERROR),

    // Registration errors
    PHONE_NUMBER_ALREADY_EXISTS("3005", "Phone number already exists", "Số điện thoại này đã được sử dụng", HttpStatus.CONFLICT),
    BUSINESS_LICENSE_ALREADY_EXISTS("3006", "Business license already exists", "Giấy phép kinh doanh này đã được sử dụng", HttpStatus.CONFLICT),
    TAX_CODE_ALREADY_EXISTS("3007", "Tax code already exists", "Mã số thuế này đã được sử dụng", HttpStatus.CONFLICT);


    private final String code;
    private final String message;
    private final String vietnameseMessage;
    private final HttpStatus httpStatus;

    ErrorCode(String code, String message, String vietnameseMessage, HttpStatus httpStatus) {
        this.code = code;
        this.message = message;
        this.vietnameseMessage = vietnameseMessage;
        this.httpStatus = httpStatus;
    }
}
