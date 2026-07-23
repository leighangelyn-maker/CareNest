package com.example.carenest.payment.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.carenest.payment.Payment;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    Optional<Payment> findByBooking_Id(UUID bookingId);

    Optional<Payment> findByPaystackReference(String paystackReference);
}