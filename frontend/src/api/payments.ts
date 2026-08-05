import apiClient from './client';

export interface ApiPayment {
  id: string;
  bookingId: string;
  amountMinorUnits: number;
  currency: string;
  status: 'PENDING' | 'PAID' | 'FAILED';
  paystackReference: string;
  paidAt?: string;
}

export async function getPaymentByBooking(bookingId: string): Promise<ApiPayment | null> {
  try {
    const res = await apiClient.get(`/payments/booking/${bookingId}`);
    const raw = res.data as any;
    return raw?.data ?? raw;
  } catch {
    return null;
  }
}