package com.example.carenest.booking;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.example.carenest.agency.Agency;
import com.example.carenest.agency.repository.AgencyRepository;
import com.example.carenest.booking.dto.BookingResponse;
import com.example.carenest.booking.dto.CreateBookingRequest;
import com.example.carenest.booking.dto.UpdateBookingStatusRequest;
import com.example.carenest.booking.repository.BookingRepository;
import com.example.carenest.common.ServiceCategory;
import com.example.carenest.common.ServiceCategoryRepository;
import com.example.carenest.common.exception.BadRequestException;
import com.example.carenest.common.exception.ResourceNotFoundException;
import com.example.carenest.family.FamilyAddress;
import com.example.carenest.family.FamilyProfile;
import com.example.carenest.family.repository.FamilyAddressRepository;
import com.example.carenest.family.repository.FamilyProfileRepository;

/**
 * NOTE on imports: repository package paths for Agency / ServiceCategory /
 * FamilyAddress / FamilyProfile are assumed based on the booking package's
 * own layout (entity in base package, repository in a `repository`
 * sub-package). Adjust these import paths if your actual repos live
 * elsewhere - the logic below doesn't otherwise depend on the path.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService {

    private static final BigDecimal DEFAULT_PLATFORM_FEE_PCT = new BigDecimal("0.10");

    private final BookingRepository bookingRepository;
    private final FamilyProfileRepository familyProfileRepository;
    private final AgencyRepository agencyRepository;
    private final ServiceCategoryRepository serviceCategoryRepository;
    private final FamilyAddressRepository familyAddressRepository;

    @Override
    @Transactional
    public BookingResponse createBooking(UUID familyId, CreateBookingRequest request) {
        log.info("Creating booking for family {} with agency {}", familyId, request.getAgencyId());

        if (!request.getEndTime().isAfter(request.getStartTime())) {
            throw new BadRequestException("End time must be after start time");
        }

        FamilyProfile family = familyProfileRepository.findById(familyId)
                .orElseThrow(() -> new ResourceNotFoundException("Family not found: " + familyId));

        Agency agency = agencyRepository.findById(request.getAgencyId())
                .orElseThrow(() -> new ResourceNotFoundException("Agency not found: " + request.getAgencyId()));

        ServiceCategory serviceCategory = serviceCategoryRepository.findById(request.getServiceCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Service category not found: " + request.getServiceCategoryId()));

        FamilyAddress familyAddress = familyAddressRepository.findById(request.getFamilyAddressId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Family address not found: " + request.getFamilyAddressId()));

        // Conflict detection: reject overlapping bookings for this family.
        List<Booking> conflicts = bookingRepository.findOverlappingBookingsForFamily(
                familyId, request.getStartTime(), request.getEndTime());
        if (!conflicts.isEmpty()) {
            throw new BadRequestException(
                    "This family already has a booking that overlaps with the requested time slot");
        }

        BigDecimal totalHours = calculateTotalHours(request.getStartTime(), request.getEndTime());
        int subtotalMinorUnits = calculateSubtotalMinorUnits(request.getHourlyRateMinorUnits(), totalHours);
        int platformFeeMinorUnits = applyPct(subtotalMinorUnits, DEFAULT_PLATFORM_FEE_PCT);
        int agencyPayoutMinorUnits = subtotalMinorUnits - platformFeeMinorUnits;

        Booking booking = Booking.builder()
                .family(family)
                .agency(agency)
                .serviceCategory(serviceCategory)
                .familyAddress(familyAddress)
                .status(BookingStatus.PENDING_ASSIGNMENT)
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .isRecurring(request.getIsRecurring() != null && request.getIsRecurring())
                .recurrenceRule(request.getRecurrenceRule())
                .hourlyRateMinorUnits(request.getHourlyRateMinorUnits())
                .totalHours(totalHours)
                .subtotalMinorUnits(subtotalMinorUnits)
                .platformFeePct(DEFAULT_PLATFORM_FEE_PCT)
                .platformFeeMinorUnits(platformFeeMinorUnits)
                .agencyPayoutMinorUnits(agencyPayoutMinorUnits)
                .familyNotes(request.getFamilyNotes())
                .build();

        Booking saved = bookingRepository.save(booking);
        log.info("Booking {} created with status {}", saved.getId(), saved.getStatus());
        return BookingResponse.fromEntity(saved);
    }

    @Override
    public BookingResponse getBookingById(UUID bookingId) {
        return BookingResponse.fromEntity(findBookingOrThrow(bookingId));
    }

    @Override
    public List<BookingResponse> getBookingsForFamily(UUID familyId) {
        return bookingRepository.findByFamily_IdOrderByStartTimeDesc(familyId).stream()
                .map(BookingResponse::fromEntity)
                .toList();
    }

    @Override
    public List<BookingResponse> getBookingsForAgency(UUID agencyId) {
        return bookingRepository.findByAgency_IdOrderByStartTimeDesc(agencyId).stream()
                .map(BookingResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional
    public BookingResponse updateBookingStatus(UUID bookingId, UpdateBookingStatusRequest request) {
        Booking booking = findBookingOrThrow(bookingId);

        validateStatusTransition(booking.getStatus(), request.getStatus());

        booking.setStatus(request.getStatus());
        if (request.getAgencyNotes() != null) {
            booking.setAgencyNotes(request.getAgencyNotes());
        }
        if (request.getStatus() == BookingStatus.CANCELLED) {
            booking.setCancellationReason(request.getCancellationReason());
        }

        Booking saved = bookingRepository.save(booking);
        log.info("Booking {} status updated to {}", bookingId, saved.getStatus());
        return BookingResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public BookingResponse cancelBooking(UUID bookingId, String cancelledBy, String reason) {
        Booking booking = findBookingOrThrow(bookingId);

        if (booking.getStatus() == BookingStatus.COMPLETED || booking.getStatus() == BookingStatus.CANCELLED) {
            throw new BadRequestException("Cannot cancel a booking that is already " + booking.getStatus());
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancelledBy(cancelledBy);
        booking.setCancellationReason(reason);

        Booking saved = bookingRepository.save(booking);
        log.info("Booking {} cancelled by {}", bookingId, cancelledBy);
        return BookingResponse.fromEntity(saved);
    }

    private Booking findBookingOrThrow(UUID bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found: " + bookingId));
    }

    private BigDecimal calculateTotalHours(java.time.OffsetDateTime start, java.time.OffsetDateTime end) {
        long minutes = Duration.between(start, end).toMinutes();
        return BigDecimal.valueOf(minutes)
                .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);
    }

    private int calculateSubtotalMinorUnits(int hourlyRateMinorUnits, BigDecimal totalHours) {
        return BigDecimal.valueOf(hourlyRateMinorUnits)
                .multiply(totalHours)
                .setScale(0, RoundingMode.HALF_UP)
                .intValueExact();
    }

    private int applyPct(int amountMinorUnits, BigDecimal pct) {
        return BigDecimal.valueOf(amountMinorUnits)
                .multiply(pct)
                .setScale(0, RoundingMode.HALF_UP)
                .intValueExact();
    }

    /**
     * Minimal guardrail so a booking can't jump from e.g. PENDING_ASSIGNMENT
     * straight to COMPLETED. Tighten this once the full state machine (who is
     * allowed to trigger which transition - family vs agency vs system) is
     * finalized with the team.
     */
    private void validateStatusTransition(BookingStatus from, BookingStatus to) {
        if (from == BookingStatus.COMPLETED || from == BookingStatus.CANCELLED) {
            throw new BadRequestException("Cannot change status of a booking that is already " + from);
        }
        if (to == BookingStatus.COMPLETED && from != BookingStatus.IN_PROGRESS) {
            throw new BadRequestException("Booking must be IN_PROGRESS before it can be marked COMPLETED");
        }
    }
}