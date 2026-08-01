import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import { ApiBooking, EnrichedBooking, ApiServiceCategory } from './types';
import { getBookingsForFamily, cancelBooking as apiCancel, getServiceCategories } from './api/bookings';
import { getAgency } from './api/agencies';
import { useAuth } from './AuthContext';

interface BookingContextValue {
  bookings: EnrichedBooking[];
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
  const [bookings, setBookings] = useState<EnrichedBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { familyId } = useAuth();

  const categoryCache = useRef<Map<string, string>>(new Map());
  const agencyCache = useRef<Map<string, string>>(new Map());

  const resolveCategoryName = useCallback(async (id: string): Promise<string> => {
    if (categoryCache.current.has(id)) return categoryCache.current.get(id)!;
    if (categoryCache.current.size === 0) {
      try {
        const cats: ApiServiceCategory[] = await getServiceCategories();
        cats.forEach(c => categoryCache.current.set(c.id, c.name));
      } catch {}
    }
    return categoryCache.current.get(id) ?? 'Service';
  }, []);

  const resolveAgencyName = useCallback(async (id: string): Promise<string> => {
    if (agencyCache.current.has(id)) return agencyCache.current.get(id)!;
    try {
      const agency = await getAgency(id);
      const name = (agency as any)?.name ?? (agency as any)?.data?.name ?? 'Agency';
      agencyCache.current.set(id, name);
      return name;
    } catch {
      return 'Agency';
    }
  }, []);

  const enrich = useCallback(async (raw: ApiBooking[]): Promise<EnrichedBooking[]> => {
    return Promise.all(
      raw.map(async (b) => {
        const [categoryName, agencyName] = await Promise.all([
          resolveCategoryName(b.serviceCategoryId),
          resolveAgencyName(b.agencyId),
        ]);
        return { ...b, categoryName, agencyName };
      })
    );
  }, [resolveCategoryName, resolveAgencyName]);

 const fetchHistory = useCallback(async () => {
    if (!familyId) return;
    setLoading(true);
    try {
      const raw = await getBookingsForFamily(familyId);
      const enriched = await enrich(raw);
      setBookings(enriched);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [familyId, enrich]);

  const addBooking = useCallback((b: ApiBooking) => {
    Promise.all([
      resolveCategoryName(b.serviceCategoryId),
      resolveAgencyName(b.agencyId),
    ]).then(([categoryName, agencyName]) => {
      const enriched: EnrichedBooking = { ...b, categoryName, agencyName };
      setBookings(prev => {
        const filtered = prev.filter(existing => existing.id !== b.id);
        return [enriched, ...filtered];
      });
    });
  }, [resolveCategoryName, resolveAgencyName]);

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