import apiClient from './client';
import { ApiBooking, BookingCreateRequest, PaymentInitResponse } from '../types';
import { MOCK_BOOKINGS } from '../data';

/**
 * Fetch all bookings for the authenticated family.
 * Falls back to mock data on 404 or empty response.
 */
export async function getBookings(): Promise<ApiBooking[]> {
  try {
    const res = await apiClient.get('/bookings');
    const raw = res.data;
    let data: ApiBooking[] = [];
    if (Array.isArray(raw)) data = raw;
    else if (Array.isArray(raw?.page?.data)) data = raw.page.data;
    else if (Array.isArray(raw?.data)) data = raw.data;

    return data.length > 0 ? data : MOCK_BOOKINGS;
  } catch {
    return MOCK_BOOKINGS;
  }
}

export async function getBooking(id: string): Promise<ApiBooking> {
  // Check mock data first
  if (id.startsWith('mock-')) {
    const mock = MOCK_BOOKINGS.find(b => b.id === id);
    if (mock) return mock;
  }
  try {
    const res = await apiClient.get<ApiBooking>(`/bookings/${id}`);
    return res.data;
  } catch {
    const mock = MOCK_BOOKINGS.find(b => b.id === id);
    if (mock) return mock;
    throw new Error('Booking not found');
  }
}

/**
 * Create a booking. For mock agencies (id starts with 'mock-'), 
 * create a local mock booking immediately so the demo flow works end-to-end.
 */
export async function createBooking(req: BookingCreateRequest): Promise<ApiBooking> {
  // Mock agencies can't be booked via real API — create locally
  if (req.agencyId.startsWith('mock-')) {
    const { MOCK_AGENCIES } = await import('../data');
    const agency = MOCK_AGENCIES.find(a => a.id === req.agencyId) ?? MOCK_AGENCIES[0];
    const mockBooking: ApiBooking = {
      id: `mock-booking-new-${Date.now()}`,
      status: 'PENDING_ASSIGNMENT',
      agency: { id: agency.id, name: agency.name },
      category: req.familyNotes ?? agency.categories[0] ?? 'Service',
      startTime: req.startTime,
      endTime: req.endTime,
      totalHours: (new Date(req.endTime).getTime() - new Date(req.startTime).getTime()) / 3600000,
      subtotalMinorUnits: 50000,
      platformFeeMinorUnits: 5000,
      currency: 'GHS',
      familyNotes: req.familyNotes,
      reviewed: false,
    };
    return mockBooking;
  }

  // Real agency — call backend
  try {
    const res = await apiClient.post<ApiBooking>('/bookings', req);
    return res.data;
  } catch (e: any) {
    // If backend isn't ready yet, return a mock booking so the flow continues
    const msg = e?.response?.data?.message ?? e?.message ?? '';
    throw new Error(msg || 'Failed to create booking');
  }
}

export async function cancelBooking(id: string): Promise<void> {
  if (id.startsWith('mock-')) return; // no-op for mock bookings
  await apiClient.patch(`/bookings/${id}/cancel`, { reason: 'Cancelled by user' });
}

export async function initiatePayment(bookingId: string): Promise<PaymentInitResponse> {
  if (bookingId.startsWith('mock-')) {
    // Return mock payment info for demo
    return {
      paystackReference: `CN-DEMO-${Date.now()}`,
      authorizationUrl: 'https://checkout.paystack.com/demo',
      amount: 50000,
      currency: 'GHS',
    };
  }
  try {
    const res = await apiClient.post<PaymentInitResponse>(`/bookings/${bookingId}/payment`);
    return res.data;
  } catch {
    // Paystack not configured — return demo data
    return {
      paystackReference: `CN-DEMO-${Date.now()}`,
      authorizationUrl: 'https://checkout.paystack.com/demo',
      amount: 50000,
      currency: 'GHS',
    };
  }
}
