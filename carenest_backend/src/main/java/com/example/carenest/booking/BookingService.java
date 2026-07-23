package com.example.carenest.booking;

import java.util.List;
import java.util.UUID;

import com.example.carenest.booking.dto.BookingResponse;
import com.example.carenest.booking.dto.CreateBookingRequest;
import com.example.carenest.booking.dto.UpdateBookingStatusRequest;

public interface BookingService {

    BookingResponse createBooking(UUID familyId, CreateBookingRequest request);

    BookingResponse getBookingById(UUID bookingId);

    List<BookingResponse> getBookingsForFamily(UUID familyId);

    List<BookingResponse> getBookingsForAgency(UUID agencyId);

    BookingResponse updateBookingStatus(UUID bookingId, UpdateBookingStatusRequest request);

    BookingResponse cancelBooking(UUID bookingId, String cancelledBy, String reason);
}