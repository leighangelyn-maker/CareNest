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
import com.example.carenest.booking.dto.AssignWorkerRequest;
import com.example.carenest.booking.dto.BookingResponse;
import com.example.carenest.booking.dto.CreateBookingRequest;
import com.example.carenest.booking.dto.UpdateBookingPriceRequest;
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
import com.example.carenest.notification.NotificationService;
import com.example.carenest.notification.NotificationType;
import com.example.carenest.worker.Worker;
import com.example.carenest.worker.repository.WorkerRepository;

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
    private final WorkerRepository workerRepository;
    private final NotificationService notificationService;

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
                .totalHours(totalHours)
                .priceOverridden(false)
                .familyNotes(request.getFamilyNotes())
                .build();

        // Rate is optional at creation time - no worker is assigned yet.
        // If the client did supply one, treat it as a manual figure that
        // assignWorker() should not later overwrite with a worker's default.
        if (request.getHourlyRateMinorUnits() != null) {
            applyRate(booking, request.getHourlyRateMinorUnits());
            booking.setPriceOverridden(true);
        }

        Booking saved = bookingRepository.save(booking);
        log.info("Booking {} created with status {}", saved.getId(), saved.getStatus());

        // ASSUMPTION: Agency.getUser() exists (confirmed) - notify the
        // agency that a family has requested a booking.
        notificationService.create(
                agency.getUser(),
                NotificationType.NEW_BOOKING_REQUEST,
                "New booking request",
                "A family has requested a booking for " + serviceCategory.getName() + ".",
                saved.getId());

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

        notifyStatusChange(saved);

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

        notifyStatusChange(saved);

        return BookingResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public BookingResponse assignWorker(UUID bookingId, AssignWorkerRequest request) {
        Booking booking = findBookingOrThrow(bookingId);

        if (booking.getStatus() == BookingStatus.COMPLETED || booking.getStatus() == BookingStatus.CANCELLED) {
            throw new BadRequestException("Cannot assign a worker to a booking that is already " + booking.getStatus());
        }

        Worker worker = workerRepository.findById(request.getWorkerId())
                .orElseThrow(() -> new ResourceNotFoundException("Worker not found: " + request.getWorkerId()));

        if (!worker.getAgency().getId().equals(booking.getAgency().getId())) {
            throw new BadRequestException("Worker does not belong to the agency assigned to this booking");
        }

        // Worker-level conflict check: this worker can't be double-booked
        // across two different families' overlapping time slots.
        List<Booking> conflicts = bookingRepository.findOverlappingBookingsForWorker(
                worker.getId(), booking.getId(), booking.getStartTime(), booking.getEndTime());
        if (!conflicts.isEmpty()) {
            throw new BadRequestException(
                    "This worker already has a booking that overlaps with this booking's time slot");
        }

        booking.setWorker(worker);

        // Inherit the worker's default rate UNLESS the agency has already
        // manually overridden the price for this specific booking.
        if (!Boolean.TRUE.equals(booking.getPriceOverridden())) {
            applyRate(booking, worker.getDefaultHourlyRateMinorUnits());
        }

        if (booking.getStatus() == BookingStatus.PENDING_ASSIGNMENT) {
            booking.setStatus(BookingStatus.ASSIGNED);
        }

        Booking saved = bookingRepository.save(booking);
        log.info("Worker {} assigned to booking {}", worker.getId(), bookingId);

        // ASSUMPTION: FamilyProfile.getUser() exists, mirroring Agency.getUser().
        notificationService.create(
                saved.getFamily().getUser(),
                NotificationType.WORKER_ASSIGNED,
                "Worker assigned",
                worker.getFullName() + " has been assigned to your booking.",
                saved.getId());

        return BookingResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public BookingResponse updatePrice(UUID bookingId, UpdateBookingPriceRequest request) {
        Booking booking = findBookingOrThrow(bookingId);

        if (booking.getStatus() == BookingStatus.IN_PROGRESS
                || booking.getStatus() == BookingStatus.COMPLETED
                || booking.getStatus() == BookingStatus.CANCELLED) {
            throw new BadRequestException(
                    "Cannot change price once a booking is " + booking.getStatus());
        }

        applyRate(booking, request.getHourlyRateMinorUnits());
        booking.setPriceOverridden(true);

        Booking saved = bookingRepository.save(booking);
        log.info("Booking {} price manually overridden to {} minor units/hr",
                bookingId, request.getHourlyRateMinorUnits());
        return BookingResponse.fromEntity(saved);
    }

    /**
     * Fires the right notification(s) for whatever the booking's status now
     * is. Called after both updateBookingStatus() and cancelBooking(), so
     * cancellation is only notified once regardless of which path set it.
     */
    private void notifyStatusChange(Booking booking) {
        switch (booking.getStatus()) {
            case CONFIRMED -> notificationService.create(
                    booking.getFamily().getUser(),
                    NotificationType.BOOKING_CONFIRMED,
                    "Booking confirmed",
                    "Your booking has been confirmed.",
                    booking.getId());
            case CANCELLED -> {
                notificationService.create(
                        booking.getFamily().getUser(),
                        NotificationType.BOOKING_CANCELLED,
                        "Booking cancelled",
                        "Your booking has been cancelled.",
                        booking.getId());
                notificationService.create(
                        booking.getAgency().getUser(),
                        NotificationType.BOOKING_CANCELLED,
                        "Booking cancelled",
                        "A booking has been cancelled.",
                        booking.getId());
            }
            case COMPLETED -> notificationService.create(
                    booking.getFamily().getUser(),
                    NotificationType.BOOKING_COMPLETED,
                    "Booking completed",
                    "Your booking has been marked as completed.",
                    booking.getId());
            default -> {
                // No notification for PENDING_ASSIGNMENT, ASSIGNED, IN_PROGRESS,
                // DISPUTED yet - add cases here if the team wants them later.
            }
        }
    }

    private Booking findBookingOrThrow(UUID bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found: " + bookingId));
    }

    /**
     * Applies an hourly rate to a booking and recalculates
     * subtotal/platformFee/agencyPayout from it. Centralized here so
     * createBooking, assignWorker, and updatePrice all compute money the
     * same way.
     */
    private void applyRate(Booking booking, int hourlyRateMinorUnits) {
        int subtotalMinorUnits = calculateSubtotalMinorUnits(hourlyRateMinorUnits, booking.getTotalHours());
        int platformFeeMinorUnits = applyPct(subtotalMinorUnits, DEFAULT_PLATFORM_FEE_PCT);
        int agencyPayoutMinorUnits = subtotalMinorUnits - platformFeeMinorUnits;

        booking.setHourlyRateMinorUnits(hourlyRateMinorUnits);
        booking.setSubtotalMinorUnits(subtotalMinorUnits);
        booking.setPlatformFeePct(DEFAULT_PLATFORM_FEE_PCT);
        booking.setPlatformFeeMinorUnits(platformFeeMinorUnits);
        booking.setAgencyPayoutMinorUnits(agencyPayoutMinorUnits);
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