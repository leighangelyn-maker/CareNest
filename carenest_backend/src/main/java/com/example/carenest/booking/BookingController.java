package com.example.carenest.booking;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.example.carenest.booking.dto.AssignWorkerRequest;
import com.example.carenest.booking.dto.BookingResponse;
import com.example.carenest.booking.dto.CreateBookingRequest;
import com.example.carenest.booking.dto.UpdateBookingPriceRequest;
import com.example.carenest.booking.dto.UpdateBookingStatusRequest;
import com.example.carenest.common.dto.response.ApiResponse;
import com.example.carenest.security.SecurityUtils;

@Slf4j
@RestController
@RequestMapping("/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;
    private final SecurityUtils securityUtils;

    @PostMapping
    public ResponseEntity<ApiResponse<BookingResponse>> createBooking(
            @Valid @RequestBody CreateBookingRequest request) {
        UUID familyId = securityUtils.getCurrentUserId();
        BookingResponse response = bookingService.createBooking(familyId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Booking created successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BookingResponse>> getBooking(@PathVariable UUID id) {
        BookingResponse response = bookingService.getBookingById(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Booking retrieved successfully"));
    }

    @GetMapping("/family/{familyId}")
    public ResponseEntity<ApiResponse<List<BookingResponse>>> getBookingsForFamily(
            @PathVariable UUID familyId) {
        List<BookingResponse> response = bookingService.getBookingsForFamily(familyId);
        return ResponseEntity.ok(ApiResponse.success(response, "Bookings retrieved successfully"));
    }

    @GetMapping("/agency/{agencyId}")
    public ResponseEntity<ApiResponse<List<BookingResponse>>> getBookingsForAgency(
            @PathVariable UUID agencyId) {
        List<BookingResponse> response = bookingService.getBookingsForAgency(agencyId);
        return ResponseEntity.ok(ApiResponse.success(response, "Bookings retrieved successfully"));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<BookingResponse>> updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateBookingStatusRequest request) {
        BookingResponse response = bookingService.updateBookingStatus(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Booking status updated successfully"));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<BookingResponse>> cancelBooking(
            @PathVariable UUID id,
            @RequestParam(required = false) String reason) {
        UUID cancelledBy = securityUtils.getCurrentUserId();
        BookingResponse response = bookingService.cancelBooking(id, cancelledBy.toString(), reason);
        return ResponseEntity.ok(ApiResponse.success(response, "Booking cancelled successfully"));
    }

    /**
     * Agency-side: assign one of its workers to a booking. Inherits the
     * worker's default rate unless the price has already been manually
     * overridden for this booking.
     */
    @PatchMapping("/{id}/assign-worker")
    public ResponseEntity<ApiResponse<BookingResponse>> assignWorker(
            @PathVariable UUID id,
            @Valid @RequestBody AssignWorkerRequest request) {
        BookingResponse response = bookingService.assignWorker(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Worker assigned successfully"));
    }

    /**
     * Agency-side: manually override the hourly rate for this specific
     * booking (e.g. special terms negotiated with the family).
     */
    @PatchMapping("/{id}/price")
    public ResponseEntity<ApiResponse<BookingResponse>> updatePrice(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateBookingPriceRequest request) {
        BookingResponse response = bookingService.updatePrice(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Booking price updated successfully"));
    }
}