package com.example.backend.entity;

import com.example.backend.entity.enums.SupplierStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "suppliers")
public class Supplier extends User {

    @NotBlank(message = "Store name is required")
    @Size(max = 100)
    private String businessName; // Tên doanh nghiệp/thương hiệu
    private String businessLicense; // Số giấy phép kinh doanh
    private String taxCode; // Mã số thuế
    private String logoUrl;

    @OneToMany(mappedBy = "supplier", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<Store> stores = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SupplierStatus status = SupplierStatus.PENDING_APPROVAL;

    @OneToMany(mappedBy = "supplier", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<Product> products = new ArrayList<>();

    @OneToMany(mappedBy = "suggester", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<CategorySuggestion> categorySuggestions = new ArrayList<>();
}
