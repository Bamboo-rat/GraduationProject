package com.example.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "addresses")
public class Address {
    @Id
    @UuidGenerator
    private String addressId;

    @Column(nullable = false)
    private String fullName; // Tên người nhận

    @Column(nullable = false)
    private String phoneNumber;

    @Column(nullable = false)
    private String province; // Tỉnh/Thành phố

    @Column(nullable = false)
    private String district; // Quận/Huyện

    @Column(nullable = false)
    private String ward; // Phường/Xã

    @Column(nullable = false)
    private String street; // Tên đường, số nhà...

    private boolean isDefault = false;

    private Double latitude;
    private Double longitude;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

}
