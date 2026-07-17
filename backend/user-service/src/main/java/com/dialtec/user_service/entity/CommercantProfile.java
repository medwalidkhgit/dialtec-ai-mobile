package com.dialtec.user_service.entity;

import com.dialtec.user_service.enums.ShopCategory;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Entity
@Table(name = "commercant_profiles")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommercantProfile {

    @Id
    private UUID id;

    @OneToOne
    @MapsId
    @JoinColumn(name = "id")
    private UserAccount userAccount;

    @Enumerated(EnumType.STRING)
    @Column(name = "shop_category", nullable = false, length = 30)
    private ShopCategory shopCategory;

    @Column(nullable = false, length = 255)
    private String address;

    @Column(nullable = false, length = 100)
    private String city;

    @Column(name = "postal_code", nullable = false, length = 5)
    private String postalCode;

    @Column(length = 500)
    private String description;
}