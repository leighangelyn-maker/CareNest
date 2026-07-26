package com.example.carenest.booking;

import java.util.List;
import java.util.UUID;

import com.example.carenest.booking.dto.AssignWorkerRequest;
import com.example.carenest.booking.dto.BookingResponse;
import com.example.carenest.booking.dto.CreateBookingRequest;
import com.example.carenest.booking.dto.UpdateBookingPriceRequest;
import com.example.carenest.booking.dto.UpdateBookingStatusRequest;

public interface BookingService {

    BookingResponse createBooking(UUID familyId, CreateBookingRequest request);

    BookingResponse getBookingById(UUID bookingId);

    List<BookingResponse> getBookingsForFamily(UUID familyId);

    List<BookingResponse> getBookingsForAgency(UUID agencyId);

    BookingResponse updateBookingStatus(UUID bookingId, UpdateBookingStatusRequest request);

    BookingResponse cancelBooking(UUID bookingId, String cancelledBy, String reason);

    /**
     * Assigns (or reassigns) a worker to a booking. If the booking's price
     * hasn't been manually overridden, the worker's default hourly rate is
     * inherited and the subtotal/fee/payout are recalculated. Runs
     * worker-level conflict detection before assigning.
     */
    BookingResponse assignWorker(UUID bookingId, AssignWorkerRequest request);

    /**
     * Lets the agency override the hourly rate for one specific booking.
     * Marks the booking as price-overridden so future worker
     * assignment/reassignment won't clobber this manual adjustment.
     */
    BookingResponse updatePrice(UUID bookingId, UpdateBookingPriceRequest request);
}