import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ApiBooking } from './types';
import { getBookings, cancelBooking as apiCancel } from './api/bookings';
import { MOCK_BOOKINGS } from './data';

interface BookingContextValue {
  bookings: ApiBooking[];
  loading: boolean;
  error: string | null;
  fetchHistory(): Promise<void>;
  addBooking(b: ApiBooking): void;
  cancelBooking(id: string): Promise<void>;
  markReviewed(id: string): void;
}

const BookingContext = createContext<BookingContextValue>({
  bookings: [],
  loading: false,
  error: null,
  fetchHistory: async () => {},
  addBooking: () => {},
  cancelBooking: async () => {},
  markReviewed: () => {},
});

export function BookingProvider({ children }: { children: ReactNode }) {
  // Seed with mock bookings so the list is never empty on first load
  const [bookings, setBookings] = useState<ApiBooking[]>(MOCK_BOOKINGS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiData = await getBookings();
      if (apiData.length > 0) {
        // Merge: real data + any locally-created mock bookings not in API result
        setBookings(prev => {
          const apiIds = new Set(apiData.map(b => b.id));
          const localOnly = prev.filter(b => !apiIds.has(b.id));
          return [...apiData, ...localOnly];
        });
      }
      // If API returns only mock data (length matches MOCK_BOOKINGS exactly), keep existing
      setFetched(true);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, []);

  // Add a new booking to the top of the list immediately
  const addBooking = useCallback((b: ApiBooking) => {
    setBookings(prev => {
      // Remove any existing entry with same id, then prepend
      const filtered = prev.filter(existing => existing.id !== b.id);
      return [b, ...filtered];
    });
  }, []);

  const cancelBooking = useCallback(async (id: string) => {
    await apiCancel(id);
    setBookings(prev =>
      prev.map(b => b.id === id ? { ...b, status: 'CANCELLED' as const } : b)
    );
  }, []);

  const markReviewed = useCallback((id: string) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, reviewed: true } : b));
  }, []);

  return (
    <BookingContext.Provider value={{ bookings, loading, error, fetchHistory, addBooking, cancelBooking, markReviewed }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBookings() {
  return useContext(BookingContext);
}
