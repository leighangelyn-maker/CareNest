import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://carenest-2k59.onrender.com';

// ── Helper to get token ────────────────────────────────────────────────────
export const getToken = async () => {
  return await AsyncStorage.getItem('token');
};

// ── Helper for headers ─────────────────────────────────────────────────────
const authHeaders = async () => {
  const token = await getToken();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

// ── Auto-refresh wrapper ───────────────────────────────────────────────────
// JWTs expire (usually 15-30 min). Any authenticated call that gets a 401
// or 403 automatically tries refreshing the token once, then retries.
const refreshAccessToken = async (): Promise<boolean> => {
  const refreshToken = await AsyncStorage.getItem('refreshToken');
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!response.ok) return false;

    const text = await response.text();
    if (!text) return false;
    const data = JSON.parse(text);
    const newAccessToken = data.data?.accessToken ?? data.accessToken;
    if (!newAccessToken) return false;

    await AsyncStorage.setItem('token', newAccessToken);
    return true;
  } catch {
    return false;
  }
};

export const authFetch = async (url: string, options: RequestInit = {}) => {
  const headers = await authHeaders();
  let response = await fetch(url, { ...options, headers: { ...headers, ...(options.headers || {}) } });

  if (response.status === 401 || response.status === 403) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const newHeaders = await authHeaders();
      response = await fetch(url, { ...options, headers: { ...newHeaders, ...(options.headers || {}) } });
    }
  }

  return response;
};

// Safely parses a response body, whether or not it's actually there.
const parseResponse = async (response: Response) => {
  const text = await response.text();
  return text ? JSON.parse(text) : null;
};

// ── AUTH ───────────────────────────────────────────────────────────────────
// These happen before login, so they don't use authFetch (no token yet).

export const loginUser = async (email: string, password: string) => {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await parseResponse(response);
  if (!response.ok) throw new Error(data?.message || 'Login failed');
  return data;
};

export const registerUser = async (
  firstName: string, lastName: string, email: string, phone: string, password: string
) => {
  const response = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ firstName, lastName, email, phone, password }),
  });
  const data = await parseResponse(response);
  if (!response.ok) throw new Error(data?.message || 'Registration failed');
  return data;
};

export const registerAgency = async (
  email: string, phone: string, password: string,
  agencyName: string, agencyPhone: string, agencyEmail: string, agencyDescription: string
) => {
  const response = await fetch(`${BASE_URL}/auth/register-agency`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, phone, password, agencyName, agencyPhone, agencyEmail, agencyDescription }),
  });
  const data = await parseResponse(response);
  if (!response.ok) throw new Error(data?.message || 'Agency registration failed');
  return data;
};

export const verifyEmail = async (token: string) => {
  const response = await fetch(`${BASE_URL}/auth/verify-email?token=${encodeURIComponent(token)}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await parseResponse(response);
  if (!response.ok) throw new Error(data?.message || 'Verification failed. The link may have expired.');
  return data;
};

export const resendVerification = async (email: string) => {
  const response = await fetch(`${BASE_URL}/auth/resend-verification?email=${encodeURIComponent(email)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await parseResponse(response);
  if (!response.ok) throw new Error(data?.message || 'Could not resend verification email');
  return data;
};

// ── AGENCIES ───────────────────────────────────────────────────────────────

export const getAgencies = async (filters?: { category?: string; city?: string; minRating?: number }) => {
  const params = new URLSearchParams();
  if (filters?.category) params.append('category', filters.category);
  if (filters?.city) params.append('city', filters.city);
  if (filters?.minRating !== undefined) params.append('minRating', String(filters.minRating));
  const query = params.toString();

  const response = await authFetch(`${BASE_URL}/agencies${query ? `?${query}` : ''}`);
  const data = await parseResponse(response);
  if (!response.ok) throw new Error(data?.message || 'Failed to fetch agencies');
  return data;
};

export const getAgencyById = async (id: string) => {
  const response = await authFetch(`${BASE_URL}/agencies/${id}`);
  const data = await parseResponse(response);
  if (!response.ok) throw new Error(data?.message || 'Failed to fetch agency');
  return data;
};

export const getAgencyDashboard = async (agencyId: string) => {
  const response = await authFetch(`${BASE_URL}/agencies/${agencyId}/dashboard`);
  const data = await parseResponse(response);
  if (!response.ok) throw new Error(data?.message || 'Failed to fetch dashboard');
  return data;
};

// ── FAMILY/CLIENT ──────────────────────────────────────────────────────────

export const getFamilyProfile = async () => {
  const response = await authFetch(`${BASE_URL}/family/me`);
  const data = await parseResponse(response);
  if (!response.ok) throw new Error(data?.message || 'Failed to fetch profile');
  return data;
};

export const updateFamilyProfile = async (profileData: any) => {
  const response = await authFetch(`${BASE_URL}/family/me`, {
    method: 'PATCH',
    body: JSON.stringify(profileData),
  });
  const data = await parseResponse(response);
  if (!response.ok) throw new Error(data?.message || 'Failed to update profile');
  return data;
};

export const getMyAddresses = async () => {
  const response = await authFetch(`${BASE_URL}/family/me/addresses`);
  const data = await parseResponse(response);
  if (!response.ok) throw new Error(data?.message || 'Failed to fetch addresses');
  return data;
};

export const addAddress = async (addressData: {
  label: string;
  line1: string;
  line2?: string;
  city: string;
  region: string;
  latitude: number;
  longitude: number;
  default: boolean;
}) => {
  const response = await authFetch(`${BASE_URL}/family/me/addresses`, {
    method: 'POST',
    body: JSON.stringify(addressData),
  });
  const data = await parseResponse(response);
  if (!response.ok) throw new Error(data?.message || `Failed to add address (status ${response.status})`);
  if (!data) throw new Error('Server returned an empty response. Please try again.');
  return data;
};

export const deleteAddress = async (addressId: string) => {
  const response = await authFetch(`${BASE_URL}/family/me/addresses/${addressId}`, { method: 'DELETE' });
  if (!response.ok) {
    const data = await parseResponse(response);
    throw new Error(data?.message || 'Failed to delete address');
  }
  return true;
};

export const getSavedAgencies = async () => {
  const response = await authFetch(`${BASE_URL}/family/me/saved-agencies`);
  const data = await parseResponse(response);
  if (!response.ok) throw new Error(data?.message || 'Failed to fetch saved agencies');
  return data;
};

export const saveAgency = async (agencyId: string) => {
  const response = await authFetch(`${BASE_URL}/family/me/saved-agencies/${agencyId}`, { method: 'POST' });
  if (!response.ok) {
    const data = await parseResponse(response);
    throw new Error(data?.message || 'Failed to save agency');
  }
  return true;
};

export const unsaveAgency = async (agencyId: string) => {
  const response = await authFetch(`${BASE_URL}/family/me/saved-agencies/${agencyId}`, { method: 'DELETE' });
  if (!response.ok) {
    const data = await parseResponse(response);
    throw new Error(data?.message || 'Failed to remove saved agency');
  }
  return true;
};

// ── BOOKINGS ───────────────────────────────────────────────────────────────

export const createBooking = async (bookingData: {
  agencyId: string;
  serviceCategoryId: string;
  familyAddressId: string;
  startTime: string;
  endTime: string;
  isRecurring?: boolean;
  recurrenceRule?: string;
  hourlyRateMinorUnits?: number;
  familyNotes?: string;
}) => {
  const response = await authFetch(`${BASE_URL}/bookings`, {
    method: 'POST',
    body: JSON.stringify(bookingData),
  });
  const data = await parseResponse(response);
  if (!response.ok) throw new Error(data?.message || 'Failed to create booking');
  return data;
};

export const getBookingById = async (id: string) => {
  const response = await authFetch(`${BASE_URL}/bookings/${id}`);
  const data = await parseResponse(response);
  if (!response.ok) throw new Error(data?.message || 'Failed to fetch booking');
  return data;
};

export const getBookingsByFamily = async (familyId: string) => {
  const response = await authFetch(`${BASE_URL}/bookings/family/${familyId}`);
  const data = await parseResponse(response);
  if (!response.ok) throw new Error(data?.message || 'Failed to fetch bookings');
  return data;
};

export const getBookingsByAgency = async (agencyId: string) => {
  const response = await authFetch(`${BASE_URL}/bookings/agency/${agencyId}`);
  const data = await parseResponse(response);
  if (!response.ok) throw new Error(data?.message || 'Failed to fetch bookings');
  return data;
};

export const updateBookingStatus = async (
  id: string,
  payload: { status: string; cancellationReason?: string; agencyNotes?: string }
) => {
  const response = await authFetch(`${BASE_URL}/bookings/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  const data = await parseResponse(response);
  if (!response.ok) throw new Error(data?.message || 'Failed to update booking status');
  return data;
};

export const cancelBooking = async (id: string, reason?: string) => {
  const query = reason ? `?reason=${encodeURIComponent(reason)}` : '';
  const response = await authFetch(`${BASE_URL}/bookings/${id}/cancel${query}`, { method: 'POST' });
  const data = await parseResponse(response);
  if (!response.ok) throw new Error(data?.message || 'Failed to cancel booking');
  return data;
};

export const setBookingPrice = async (id: string, hourlyRateMinorUnits: number) => {
  const response = await authFetch(`${BASE_URL}/bookings/${id}/price`, {
    method: 'PATCH',
    body: JSON.stringify({ hourlyRateMinorUnits }),
  });
  const data = await parseResponse(response);
  if (!response.ok) throw new Error(data?.message || 'Failed to set price');
  return data;
};

export const assignWorkerToBooking = async (id: string, workerId: string) => {
  const response = await authFetch(`${BASE_URL}/bookings/${id}/assign-worker`, {
    method: 'PATCH',
    body: JSON.stringify({ workerId }),
  });
  const data = await parseResponse(response);
  if (!response.ok) throw new Error(data?.message || 'Failed to assign worker');
  return data;
};

// ── PAYMENTS ───────────────────────────────────────────────────────────────

export const initiatePayment = async (bookingId: string) => {
  const response = await authFetch(`${BASE_URL}/payments/initiate`, {
    method: 'POST',
    body: JSON.stringify({ bookingId }),
  });
  const data = await parseResponse(response);
  if (!response.ok) throw new Error(data?.message || 'Failed to initiate payment');
  return data;
};

export const getPaymentById = async (id: string) => {
  const response = await authFetch(`${BASE_URL}/payments/${id}`);
  const data = await parseResponse(response);
  if (!response.ok) throw new Error(data?.message || 'Failed to fetch payment');
  return data;
};

export const getPaymentByBooking = async (bookingId: string) => {
  const response = await authFetch(`${BASE_URL}/payments/booking/${bookingId}`);
  const data = await parseResponse(response);
  if (!response.ok) throw new Error(data?.message || 'Failed to fetch payment status');
  return data;
};

// ── NOTIFICATIONS ──────────────────────────────────────────────────────────

export const getNotifications = async () => {
  const response = await authFetch(`${BASE_URL}/notifications`);
  const data = await parseResponse(response);
  if (!response.ok) throw new Error(data?.message || 'Failed to fetch notifications');
  return data;
};

export const getUnreadNotificationCount = async () => {
  const response = await authFetch(`${BASE_URL}/notifications/unread-count`);
  const data = await parseResponse(response);
  if (!response.ok) throw new Error(data?.message || 'Failed to fetch unread count');
  return data;
};

export const markNotificationRead = async (id: string) => {
  const response = await authFetch(`${BASE_URL}/notifications/${id}/read`, { method: 'PATCH' });
  const data = await parseResponse(response);
  if (!response.ok) throw new Error(data?.message || 'Failed to mark as read');
  return data;
};

export const markAllNotificationsRead = async () => {
  const response = await authFetch(`${BASE_URL}/notifications/read-all`, { method: 'PATCH' });
  const data = await parseResponse(response);
  if (!response.ok) throw new Error(data?.message || 'Failed to mark all as read');
  return data;
};

// ── REVIEWS ────────────────────────────────────────────────────────────────

export const submitReview = async (
  familyId: string,
  reviewData: { bookingId: string; rating: number; comment: string }
) => {
  const response = await authFetch(`${BASE_URL}/reviews?familyId=${familyId}`, {
    method: 'POST',
    body: JSON.stringify(reviewData),
  });
  const data = await parseResponse(response);
  if (!response.ok) throw new Error(data?.message || 'Failed to submit review');
  return data;
};

export const getReviewsByAgency = async (agencyId: string) => {
  const response = await authFetch(`${BASE_URL}/reviews/agency/${agencyId}`);
  const data = await parseResponse(response);
  if (!response.ok) throw new Error(data?.message || 'Failed to fetch reviews');
  return data;
};

export const getReviewsByFamily = async (familyId: string) => {
  const response = await authFetch(`${BASE_URL}/reviews/family/${familyId}`);
  const data = await parseResponse(response);
  if (!response.ok) throw new Error(data?.message || 'Failed to fetch reviews');
  return data;
};

// ── WORKERS ────────────────────────────────────────────────────────────────

export const createWorker = async (workerData: {
  agencyId: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  serviceCategoryId: string;
  defaultHourlyRateMinorUnits: number;
}) => {
  const response = await authFetch(`${BASE_URL}/workers`, {
    method: 'POST',
    body: JSON.stringify(workerData),
  });
  const data = await parseResponse(response);
  if (!response.ok) throw new Error(data?.message || 'Failed to add worker');
  return data;
};

export const getWorkersByAgency = async (agencyId: string) => {
  const response = await authFetch(`${BASE_URL}/workers/agency/${agencyId}`);
  const data = await parseResponse(response);
  if (!response.ok) throw new Error(data?.message || 'Failed to fetch workers');
  return data;
};

export const getWorkerById = async (id: string) => {
  const response = await authFetch(`${BASE_URL}/workers/${id}`);
  const data = await parseResponse(response);
  if (!response.ok) throw new Error(data?.message || 'Failed to fetch worker');
  return data;
};

export const updateWorkerStatus = async (id: string, status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE') => {
  const response = await authFetch(`${BASE_URL}/workers/${id}/status?status=${status}`, {
    method: 'PATCH',
  });
  const data = await parseResponse(response);
  if (!response.ok) throw new Error(data?.message || 'Failed to update worker status');
  return data;
};

export const searchWorkers = async (filters?: {
  serviceCategoryId?: string;
  city?: string;
  region?: string;
}) => {
  const params = new URLSearchParams();
  if (filters?.serviceCategoryId) params.append('serviceCategoryId', filters.serviceCategoryId);
  if (filters?.city) params.append('city', filters.city);
  if (filters?.region) params.append('region', filters.region);
  const query = params.toString();

  const response = await authFetch(`${BASE_URL}/workers/search${query ? `?${query}` : ''}`);
  const data = await parseResponse(response);
  if (!response.ok) throw new Error(data?.message || 'Failed to search workers');
  return data;
};