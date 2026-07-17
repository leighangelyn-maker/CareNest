package com.example.carenest.worker;

import lombok.Data;
//importing the required packages
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.example.carenest.agency.Agency;
import com.example.carenest.agency.VerificationStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

//Defining the Worker entity and mapping it to the "workers" table in the database.
@Entity
@Table
@Data
public class Worker {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "agency_id", nullable = false)
    private Agency agency;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Column(name = "photo_url")
    private String photoUrl;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "phone", nullable = false)
    private String phone;

    @Column(name = "bio")
    private String bio;

    @Column(name = "years_experience")
    private Integer yearsExperience = 0;

    @Column(name = "status", nullable = false)
    private WorkerStatus status;

    @Column(name = "verification_status", nullable = false)
    private VerificationStatus verificationStatus;

    @Column(name = "background_check_status")
    private VerificationStatus backgroundCheckStatus;

    @Column(name = "average_rating")
    private BigDecimal averageRating;

    @Column(name = "total_reviews")
    private Integer totalReviews;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
}
