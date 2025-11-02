package com.example.backend.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {

    // ===== 1xxx: General & Validation Errors =====
    VALIDATION_ERROR("1001", "Validation failed", "Lỗi xác thực dữ liệu không hợp lệ", HttpStatus.BAD_REQUEST),
    INVALID_REQUEST("1002", "Invalid request data", "Dữ liệu yêu cầu không hợp lệ", HttpStatus.BAD_REQUEST),
    RESOURCE_NOT_FOUND("1003", "Resource not found", "Không tìm thấy tài nguyên được yêu cầu", HttpStatus.NOT_FOUND),
    INVALID_INPUT("1004", "Invalid input", "Dữ liệu đầu vào không hợp lệ", HttpStatus.BAD_REQUEST),
    INVALID_EMAIL("1005", "Invalid email format", "Định dạng email không hợp lệ", HttpStatus.BAD_REQUEST),
    WEAK_PASSWORD("1006", "Password is too weak", "Mật khẩu quá yếu, cần ít nhất 8 ký tự, chữ hoa, chữ thường, số và ký tự đặc biệt", HttpStatus.BAD_REQUEST),
    INVALID_PHONE_NUMBER("1007", "Invalid phone number format", "Định dạng số điện thoại không hợp lệ", HttpStatus.BAD_REQUEST),
    INVALID_AGE("1008", "Age requirement not met", "Bạn phải đủ 18 tuổi để đăng ký", HttpStatus.BAD_REQUEST),

    // ===== 2xxx: Authentication & Authorization Errors =====
    UNAUTHENTICATED("2001", "Unauthenticated", "Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED("2002", "Forbidden", "Bạn không có quyền thực hiện hành động này", HttpStatus.FORBIDDEN),
    TOKEN_INVALID("2003", "Invalid token", "Token không hợp lệ hoặc đã hết hạn", HttpStatus.UNAUTHORIZED),
    ACCOUNT_LOCKED("2004", "Account is locked", "Tài khoản của bạn đã bị khóa", HttpStatus.FORBIDDEN),
    ACCOUNT_INACTIVE("2005", "Account is inactive", "Tài khoản của bạn chưa được kích hoạt", HttpStatus.FORBIDDEN),
    VERIFICATION_TOKEN_INVALID("2006", "Invalid or expired verification token", "Token xác thực không hợp lệ hoặc đã hết hạn", HttpStatus.BAD_REQUEST),
    VERIFICATION_TOKEN_ALREADY_USED("2007", "Verification token already used", "Token xác thực đã được sử dụng", HttpStatus.BAD_REQUEST),
    EMAIL_ALREADY_VERIFIED("2008", "Email already verified", "Email đã được xác thực", HttpStatus.BAD_REQUEST),
    ACCOUNT_NOT_VERIFIED("2009", "Account email not verified", "Bạn cần xác thực email trước khi đăng nhập. Vui lòng kiểm tra email của bạn", HttpStatus.FORBIDDEN),
    ACCOUNT_PENDING_APPROVAL("2010", "Account pending approval", "Tài khoản của bạn đang chờ phê duyệt từ quản trị viên", HttpStatus.FORBIDDEN),
    ACCOUNT_REJECTED("2011", "Account has been rejected", "Tài khoản của bạn đã bị từ chối", HttpStatus.FORBIDDEN),
    INVALID_REFRESH_TOKEN("2012", "Invalid refresh token", "Refresh token không hợp lệ hoặc đã hết hạn", HttpStatus.UNAUTHORIZED),
    INVALID_OTP("2013", "Invalid or expired OTP", "Mã OTP không hợp lệ hoặc đã hết hạn", HttpStatus.BAD_REQUEST),
    SMS_SEND_FAILED("2014", "Failed to send SMS", "Gửi tin nhắn SMS thất bại", HttpStatus.INTERNAL_SERVER_ERROR),
    OTP_RATE_LIMIT_EXCEEDED("2015", "Too many OTP requests", "Bạn đã yêu cầu quá nhiều mã OTP. Vui lòng thử lại sau 1 giờ", HttpStatus.TOO_MANY_REQUESTS),
    INVALID_TOKEN("2016", "Invalid token", "Token không hợp lệ", HttpStatus.BAD_REQUEST),
    TOKEN_EXPIRED("2017", "Token has expired", "Token đã hết hạn. Vui lòng yêu cầu token mới", HttpStatus.BAD_REQUEST),
    TOKEN_ALREADY_USED("2018", "Token has already been used", "Token này đã được sử dụng", HttpStatus.BAD_REQUEST),
    PASSWORD_MISMATCH("2019", "Passwords do not match", "Mật khẩu không khớp nhau", HttpStatus.BAD_REQUEST),

    // ===== 3xxx: User, Customer, Supplier Errors =====
    USER_NOT_FOUND("3001", "User not found", "Không tìm thấy người dùng", HttpStatus.NOT_FOUND),
    EMAIL_ALREADY_EXISTS("3002", "Email already exists", "Email này đã được sử dụng", HttpStatus.CONFLICT),
    USERNAME_ALREADY_EXISTS("3003", "Username already exists", "Tên đăng nhập này đã được sử dụng", HttpStatus.CONFLICT),
    PHONE_NUMBER_ALREADY_EXISTS("3004", "Phone number already exists", "Số điện thoại này đã được sử dụng", HttpStatus.CONFLICT),
    BUSINESS_LICENSE_ALREADY_EXISTS("3005", "Business license already exists", "Số giấy phép kinh doanh này đã được đăng ký", HttpStatus.CONFLICT),
    TAX_CODE_ALREADY_EXISTS("3006", "Tax code already exists", "Mã số thuế này đã được đăng ký", HttpStatus.CONFLICT),
    SUPPLIER_NOT_APPROVED("3007", "Supplier not yet approved", "Tài khoản nhà cung cấp của bạn chưa được duyệt", HttpStatus.FORBIDDEN),
    REGISTRATION_FAILED("3008", "Registration failed", "Đăng ký tài khoản thất bại", HttpStatus.BAD_REQUEST),
    INVALID_STATUS_TRANSITION("3009", "Invalid status transition", "Không thể chuyển đổi trạng thái này", HttpStatus.BAD_REQUEST),
    SUPPLIER_ALREADY_SUSPENDED("3010", "Supplier is already suspended", "Nhà cung cấp đã bị đình chỉ", HttpStatus.BAD_REQUEST),
    SUPPLIER_NOT_SUSPENDED("3011", "Supplier is not suspended", "Nhà cung cấp không ở trạng thái đình chỉ", HttpStatus.BAD_REQUEST),
    SUPPLIER_NOT_ACTIVE("3012", "Supplier is not active", "Nhà cung cấp không ở trạng thái hoạt động", HttpStatus.BAD_REQUEST),
    SUPPLIER_NOT_PAUSED("3013", "Supplier is not paused", "Nhà cung cấp không ở trạng thái tạm dừng", HttpStatus.BAD_REQUEST),
    CANNOT_SELF_UNSUSPEND("3014", "Cannot unsuspend by yourself", "Bạn không thể tự gỡ bỏ đình chỉ", HttpStatus.FORBIDDEN),

    // ===== 4xxx: Product & Category Errors =====
    PRODUCT_NOT_FOUND("4001", "Product not found", "Không tìm thấy sản phẩm", HttpStatus.NOT_FOUND),
    CATEGORY_NOT_FOUND("4002", "Category not found", "Không tìm thấy danh mục sản phẩm", HttpStatus.NOT_FOUND),
    PRODUCT_OUT_OF_STOCK("4003", "Product is out of stock", "Sản phẩm đã hết hàng", HttpStatus.BAD_REQUEST),
    INVALID_EXPIRY_DATE("4004", "Invalid expiry date", "Ngày hết hạn của sản phẩm không hợp lệ", HttpStatus.BAD_REQUEST),
    CATEGORY_NAME_ALREADY_EXISTS("4005", "Category name already exists", "Tên danh mục này đã tồn tại", HttpStatus.CONFLICT),
    CATEGORY_HAS_PRODUCTS("4006", "Category has products", "Không thể xóa danh mục đang chứa sản phẩm. Vui lòng xóa hoặc chuyển sản phẩm sang danh mục khác trước", HttpStatus.CONFLICT),
    CATEGORY_ALREADY_EXISTS("4007", "Category already exists", "Danh mục này đã tồn tại", HttpStatus.CONFLICT),
    STORE_NOT_FOUND("4008", "Store not found", "Không tìm thấy cửa hàng", HttpStatus.NOT_FOUND),
    STORE_NAME_ALREADY_EXISTS("4009", "Store name already exists", "Tên cửa hàng này đã tồn tại cho nhà cung cấp", HttpStatus.CONFLICT),
    BANNER_NOT_FOUND("4010", "Banner not found", "Không tìm thấy banner", HttpStatus.NOT_FOUND),

    // ===== 5xxx: Cart, Order, Payment, Promotion Errors =====
    ORDER_NOT_FOUND("5001", "Order not found", "Không tìm thấy đơn hàng", HttpStatus.NOT_FOUND),
    CART_NOT_FOUND("5002", "Cart not found", "Không tìm thấy giỏ hàng", HttpStatus.NOT_FOUND),
    PROMOTION_NOT_FOUND("5003", "Promotion code not found", "Không tìm thấy mã khuyến mãi", HttpStatus.NOT_FOUND),
    PROMOTION_EXPIRED_OR_INACTIVE("5004", "Promotion is expired or inactive", "Mã khuyến mãi đã hết hạn hoặc không hoạt động", HttpStatus.BAD_REQUEST),
    PROMOTION_NOT_APPLICABLE("5005", "Promotion is not applicable for this order", "Mã khuyến mãi không áp dụng cho đơn hàng này", HttpStatus.BAD_REQUEST),
    PAYMENT_FAILED("5006", "Payment processing failed", "Quá trình thanh toán thất bại", HttpStatus.BAD_REQUEST),
    CANNOT_CANCEL_ORDER("5007", "Order cannot be canceled", "Không thể hủy đơn hàng đã được vận chuyển", HttpStatus.BAD_REQUEST),
    PROMOTION_CODE_ALREADY_EXISTS("5008", "Promotion code already exists", "Mã khuyến mãi này đã tồn tại", HttpStatus.CONFLICT),
    INVALID_PROMOTION_DATES("5009", "Invalid promotion dates", "Ngày kết thúc phải sau ngày bắt đầu", HttpStatus.BAD_REQUEST),
    PROMOTION_ALREADY_STARTED("5010", "Promotion already started", "Không thể cập nhật mã khuyến mãi đã bắt đầu", HttpStatus.BAD_REQUEST),

    // ===== 6xxx: Wallet Errors =====
    WALLET_NOT_FOUND("6001", "Wallet not found", "Không tìm thấy ví tiền", HttpStatus.NOT_FOUND),
    INSUFFICIENT_BALANCE("6002", "Insufficient balance", "Số dư không đủ", HttpStatus.BAD_REQUEST),
    WALLET_SUSPENDED("6003", "Wallet is suspended", "Ví đã bị tạm khóa", HttpStatus.FORBIDDEN),
    WALLET_FROZEN("6004", "Wallet is frozen", "Ví đã bị đóng băng", HttpStatus.FORBIDDEN),

    // ===== 9xxx: Internal/Server Errors =====
    OPTIMISTIC_LOCK_ERROR("9001", "Data has been modified by another user", "Dữ liệu đã được thay đổi bởi người dùng khác. Vui lòng thử lại", HttpStatus.CONFLICT),
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
    KEYCLOAK_PASSWORD_UPDATE_FAILED("K3007", "Failed to update password in Keycloak", "Cập nhật mật khẩu thất bại", HttpStatus.INTERNAL_SERVER_ERROR);

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
