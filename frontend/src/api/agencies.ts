import apiClient from './client';
import { AgencySummary, AgencyProfile } from '../types';

/**
 * Search agencies with optional filters.
 */
export async function searchAgencies(
  category?: string,
  city?: string,
  minRating?: number,
): Promise<AgencySummary[]> {
  const params: Record<string, string | number> = {};
  if (category && category !== 'All') params.category = category;
  if (city) params.city = city;
  if (minRating !== undefined) params.minRating = minRating;

  const res = await apiClient.get('/agencies', { params });
  const raw = res.data;

  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.page?.data)) return raw.page.data;
  if (Array.isArray(raw?.data)) return raw.data;
  return [];
}

/**
 * Fetch a full agency profile by UUID.
 */
export async function getAgency(id: string): Promise<AgencyProfile> {
  const res = await apiClient.get<AgencyProfile>(`/agencies/${id}`);
  return res.data;
}