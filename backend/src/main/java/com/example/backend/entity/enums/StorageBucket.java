package com.example.backend.entity.enums;

/**
 * Enum for Cloudinary Storage folder types
 */
public enum StorageBucket {
    BUSINESS_LICENSES("business-licenses", "Business license documents for suppliers"),
    BANNER("banner", "Banner images for promotions and marketing"),
    PRODUCTS("products", "Product images"),
    AVATAR_CUSTOMER("avatar-customer", "Customer profile avatars"),
    AVATAR_ADMIN("avatar-admin", "Admin profile avatars"),
    SUPPLIER_LOGO("supplier-logo", "Supplier business logos");

    private final String folderName;
    private final String description;

    StorageBucket(String folderName, String description) {
        this.folderName = folderName;
        this.description = description;
    }

    public String getFolderName() {
        return folderName;
    }

    public String getDescription() {
        return description;
    }

    // Backward compatibility
    @Deprecated
    public String getBucketName() {
        return folderName;
    }
}
