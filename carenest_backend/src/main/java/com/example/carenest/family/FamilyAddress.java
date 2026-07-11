package com.example.carenest.family;

//importing the required packages
import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Changelog.Timestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

//Defining the FamilyAddress entity and mapping it to the "family_addresses" table in the database. 
@Entity
@Table(name = "family_addresses")
public class FamilyAddress {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "family_id", nullable = false)
    private FamilyProfile familyProfile;

    @Column(name = "label", nullable = false)
    private String label;

    @Column(name = "line_1", nullable = false)
    private String line1;

    @Column(name = "line_2", nullable = true)
    private String line2;

    @Column(name = "city", nullable = false)
    private String city;

    @Column(name = "region", nullable = false)
    private String region;

    @Column(name = "country")
    private String country = "Ghana";

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "is_default")
    private Boolean isDefault;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

}
