import apiClient from './client';
import { ApiBooking, ApiServiceCategory, ApiFamilyAddress, BookingCreateRequest, PaymentInitResponse, BookingStatus } from '../types';

export async function getBookingsForFamily(familyId: string): Promise<ApiBooking[]> {
  const res = await apiClient.get(`/bookings/family/${familyId}`);
  const raw = res.data;
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.page?.data)) return raw.page.data;
  return [];
}

export async function getBooking(id: string): Promise<ApiBooking> {
  const res = await apiClient.get<{ data: ApiBooking }>(`/bookings/${id}`);
  return (res.data as any)?.data ?? res.data;
}

export async function createBooking(req: BookingCreateRequest): Promise<ApiBooking> {
  try {
    const res = await apiClient.post<{ data: ApiBooking }>('/bookings', req);
    return (res.data as any)?.data ?? res.data;
  } catch (e: any) {
    const msg = e?.response?.data?.message ?? e?.message ?? '';
    throw new Error(msg || 'Failed to create booking');
  }
}

export async function cancelBooking(id: string): Promise<void> {
  await apiClient.post(`/bookings/${id}/cancel`, { reason: 'Cancelled by user' });
}

export async function getBookingsByAgency(agencyId: string): Promise<ApiBooking[]> {
  try {
    const res = await apiClient.get(`/bookings/agency/${agencyId}`);
    const raw = res.data;
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.data)) return raw.data;
    if (Array.isArray(raw?.page?.data)) return raw.page.data;
    return [];
  } catch {
    return [];
  }
}

export async function assignWorkerToBooking(bookingId: string, workerId: string): Promise<ApiBooking> {
  const res = await apiClient.patch<{ data: ApiBooking }>(`/bookings/${bookingId}/assign-worker`, { workerId });
  return (res.data as any)?.data ?? res.data;
}

export async function updateBookingStatus(
  bookingId: string,
  status: BookingStatus,
  agencyNotes?: string
): Promise<ApiBooking> {
  const res = await apiClient.patch<{ data: ApiBooking }>(`/bookings/${bookingId}/status`, { status, agencyNotes });
  return (res.data as any)?.data ?? res.data;
}

export async function setBookingPrice(bookingId: string, amountMinorUnits: number): Promise<void> {
  await apiClient.patch(`/bookings/${bookingId}/price`, { hourlyRateMinorUnits: amountMinorUnits });
}

export async function initiatePayment(bookingId: string): Promise<PaymentInitResponse> {
  const res = await apiClient.post<PaymentInitResponse>('/payments/initiate', { bookingId });
  const raw = res.data as any;
  return raw?.data ?? raw;
}

export async function getServiceCategories(): Promise<ApiServiceCategory[]> {
  const res = await apiClient.get('/service-categories');
  const raw = res.data;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw)) return raw;
  return [];
}

export async function getFamilyAddresses(): Promise<ApiFamilyAddress[]> {
  const res = await apiClient.get('/family/me/addresses');
  const raw = res.data;
  // Swagger example shows a bare array (no `data` wrapper) for this endpoint
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  return [];
}

export async function addFamilyAddress(
   payload: { label: string; line1: string; line2?: string; city: string; region: string; latitude: number; longitude: number; default: boolean }
): Promise<ApiFamilyAddress> {
  const res = await apiClient.post('/family/me/addresses', payload);
  const raw = res.data;
  return (raw as any)?.data ?? raw;
}