package com.example.backend.entity;

import com.example.backend.entity.enums.BusinessType;
import com.example.backend.entity.enums.SupplierStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "suppliers")
public class Supplier extends User {

    @Size(max = 100)
    private String businessName; // Tên doanh nghiệp/thương hiệu
    
    private String businessLicense; // Số giấy phép kinh doanh
    private String businessLicenseUrl; // URL trỏ tới file ảnh/PDF của giấy phép kinh doanh
    
    private String foodSafetyCertificate; // Số giấy chứng nhận an toàn vệ sinh thực phẩm
    private String foodSafetyCertificateUrl; // URL file giấy chứng nhận ATTP
    
    private String taxCode; // Mã số thuế
    private String businessAddress; // Địa chỉ trụ sở doanh nghiệp
    
    @Enumerated(EnumType.STRING)
    private BusinessType businessType;

    // Tỷ lệ hoa hồng (mặc định 10% = 0.10)
    @Column(nullable = false)
    private Double commissionRate = 0.10;

    /**
     * Ví tiền của nhà cung cấp
     * Thay thế cho thông tin tài khoản ngân hàng cũ
     */
    @OneToOne(mappedBy = "supplier", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private SupplierWallet wallet;

    @OneToMany(mappedBy = "supplier", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<Store> stores = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SupplierStatus status = SupplierStatus.PENDING_APPROVAL;

    @OneToMany(mappedBy = "supplier", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<Product> products = new ArrayList<>();

    @OneToMany(mappedBy = "supplier", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<CategorySuggestion> categorySuggestions = new ArrayList<>();
}
