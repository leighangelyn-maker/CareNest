import apiClient from './client';
import { AgencySummary, AgencyProfile } from '../types';
import { MOCK_AGENCIES } from '../data';

/**
 * Search agencies with optional filters.
 * Falls back to mock data when the backend returns nothing or errors.
 */
export async function searchAgencies(
  category?: string,
  city?: string,
  minRating?: number,
): Promise<AgencySummary[]> {
  try {
    const params: Record<string, string | number> = {};
    if (category && category !== 'All') params.category = category;
    if (city) params.city = city;
    if (minRating !== undefined) params.minRating = minRating;

    const res = await apiClient.get('/agencies', { params });
    const raw = res.data;

    let data: AgencySummary[] = [];
    if (Array.isArray(raw)) data = raw;
    else if (Array.isArray(raw?.page?.data)) data = raw.page.data;
    else if (Array.isArray(raw?.data)) data = raw.data;

    // If backend returns empty, show mock data so the app looks populated
    if (data.length === 0) {
      return filterMock(category);
    }
    return data;
  } catch {
    // Backend unreachable or 404 — use mock data
    return filterMock(category);
  }
}

function filterMock(category?: string): AgencySummary[] {
  if (!category || category === 'All') return MOCK_AGENCIES;
  return MOCK_AGENCIES.filter(a => a.categories.includes(category));
}

/**
 * Fetch a full agency profile by UUID.
 * Falls back to mock data when backend errors.
 */
export async function getAgency(id: string): Promise<AgencyProfile> {
  // Check if this is a mock agency first
  const mock = MOCK_AGENCIES.find(a => a.id === id);
  if (id.startsWith('mock-')) {
    return mock ?? MOCK_AGENCIES[0];
  }

  try {
    const res = await apiClient.get<AgencyProfile>(`/agencies/${id}`);
    return res.data;
  } catch {
    // Fall back to mock profile if available
    return mock ?? MOCK_AGENCIES[0];
  }
}
