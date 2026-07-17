package com.example.carenest.payment;

//importing the required packages
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.example.carenest.booking.Booking;
import com.example.carenest.family.FamilyProfile;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

//Defining the Payment entity and mapping it to the "payments" table in the database.
@Entity
@Table(name = "payments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Payment {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @ManyToOne
    @JoinColumn(name = "family_id", nullable = false)
    private FamilyProfile familyProfile;

    @Column(name = "amount_minor_units")
    private Integer amountMinorUnits;

    @Column(name = "currency")
    @Builder.Default
    private String currency = "GHS";

    @Column(name = "status", nullable = false)
    private PaymentStatus status;

    @Column(name = "paystack_reference", nullable = false)
    private String paystackReference;

    @Column(name = "paystack_transaction_id", nullable = false)
    private String paystackTransactionId;

    @Column(name = "paid_at")
    private Instant paidAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
