package com.example.carenest.agency.service;

import com.example.carenest.agency.dto.AgencyDashboardResponse;
import com.example.carenest.agency.dto.AgencyRevenueResponse;
import com.example.carenest.agency.repository.AgencyRepository;
import com.example.carenest.agency.repository.AgencyPayoutRepository;
import com.example.carenest.booking.Booking;
import com.example.carenest.booking.BookingStatus;
import com.example.carenest.booking.repository.BookingRepository;
import com.example.carenest.agency.AgencyPayout;
import com.example.carenest.agency.PayoutStatus;
import com.example.carenest.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AgencyDashboardService {

    private final AgencyRepository agencyRepository;
    private final BookingRepository bookingRepository;
    private final AgencyPayoutRepository agencyPayoutRepository;

    public AgencyDashboardResponse getDashboardStats(UUID agencyId) {
        // Validate agency exists
        agencyRepository.findById(agencyId)
                .orElseThrow(() -> new ResourceNotFoundException("Agency not found: " + agencyId));

        // Get booking stats
        List<Booking> allBookings = bookingRepository.findByAgencyId(agencyId);
        Integer totalBookings = allBookings.size();
        Integer activeBookings = (int) allBookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.ASSIGNED ||
                            b.getStatus() == BookingStatus.CONFIRMED ||
                            b.getStatus() == BookingStatus.IN_PROGRESS)
                .count();
        Integer completedBookings = (int) allBookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.COMPLETED)
                .count();
        Integer cancelledBookings = (int) allBookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.CANCELLED)
                .count();

        // Get payout stats
        List<AgencyPayout> payouts = agencyPayoutRepository.findByAgencyId(agencyId);
        Integer pendingPayouts = (int) payouts.stream()
                .filter(p -> p.getStatus() == PayoutStatus.PENDING)
                .count();

        // Calculate total revenue.
        // NOTE: subtotalMinorUnits isn't marked non-nullable on the Booking
        // entity, so guard against nulls here rather than letting
        // mapToInt(Booking::getSubtotalMinorUnits) NPE on unboxing.
        Integer totalRevenue = allBookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.COMPLETED)
                .mapToInt(this::safeSubtotal)
                .sum();

        return AgencyDashboardResponse.builder()
                .totalBookings(totalBookings)
                .activeBookings(activeBookings)
                .completedBookings(completedBookings)
                .cancelledBookings(cancelledBookings)
                .pendingPayouts(pendingPayouts)
                .totalRevenueMinorUnits(totalRevenue)
                .totalRevenueDisplay(formatCurrency(totalRevenue))
                .build();
    }

    public AgencyRevenueResponse getAgencyRevenue(UUID agencyId, OffsetDateTime startDate, OffsetDateTime endDate) {
        // Validate agency exists
        agencyRepository.findById(agencyId)
                .orElseThrow(() -> new ResourceNotFoundException("Agency not found: " + agencyId));

        // Get bookings in date range
        List<Booking> bookings = bookingRepository.findByAgencyId(agencyId).stream()
                .filter(b -> b.getStartTime().isAfter(startDate) && b.getStartTime().isBefore(endDate))
                .filter(b -> b.getStatus() == BookingStatus.COMPLETED)
                .toList();

        Integer bookingCount = bookings.size();
        Integer totalRevenue = bookings.stream()
                .mapToInt(this::safeSubtotal)
                .sum();
        Integer platformFees = bookings.stream()
                .mapToInt(this::safePlatformFee)
                .sum();
        Integer agencyPayouts = totalRevenue - platformFees;

        return AgencyRevenueResponse.builder()
                .totalRevenueMinorUnits(totalRevenue)
                .totalRevenueDisplay(formatCurrency(totalRevenue))
                .platformFeesMinorUnits(platformFees)
                .platformFeesDisplay(formatCurrency(platformFees))
                .agencyPayoutsMinorUnits(agencyPayouts)
                .agencyPayoutsDisplay(formatCurrency(agencyPayouts))
                .bookingCount(bookingCount)
                .breakdown(List.of()) // TODO: Implement monthly breakdown
                .build();
    }

    private int safeSubtotal(Booking booking) {
        Integer value = booking.getSubtotalMinorUnits();
        return value != null ? value : 0;
    }

    private int safePlatformFee(Booking booking) {
        Integer value = booking.getPlatformFeeMinorUnits();
        return value != null ? value : 0;
    }

    private String formatCurrency(Integer minorUnits) {
        if (minorUnits == null) return "GHS 0.00";
        BigDecimal amount = BigDecimal.valueOf(minorUnits).divide(BigDecimal.valueOf(100));
        return "GHS " + amount.setScale(2, RoundingMode.HALF_UP).toString();
    }
}