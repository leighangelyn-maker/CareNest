// ─── Agency Types ─────────────────────────────────────────────────────────────

export interface AgencySummary {
  description: string;
  id: string;           // UUID
  name: string;
  slug: string;
  logoUrl: string | null;
  averageRating: number;
  totalReviews: number;
  city: string;
}

export interface AgencyProfile extends AgencySummary {
  description: string;
  isAcceptingBookings: boolean;
  categories: string[];
}

// ─── Service Category Types ────────────────────────────────────────────────────

export interface ApiServiceCategory {
  id: string;
  slug: string;
  name: string;
  description: string;
}

// ─── Family Address Types ──────────────────────────────────────────────────────

export interface ApiFamilyAddress {
  id: string;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  region: string;
  latitude: number;
  longitude: number;
  default: boolean;
}

// ─── Agency Worker Types ────────────────────────────────────────────────────
export interface ApiAgencyWorker {
  id: string;
  agencyId: string;
  agencyName: string;
  agencyCity: string;
  agencyRegion: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  serviceCategoryId: string;
  serviceCategoryName: string;
  defaultHourlyRateMinorUnits: number;
  status: string; // e.g. "ACTIVE"
  createdAt: string;
  updatedAt: string;
}
export interface WorkerCreateRequest {
  agencyId: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  serviceCategoryId: string;
  defaultHourlyRateMinorUnits: number;
}

// ─── Booking Types ────────────────────────────────────────────────────────────

export type BookingStatus =
  | 'PENDING_ASSIGNMENT'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

// Matches the real POST /bookings and GET /bookings/family/{familyId} response.
// Note: the backend only returns bare IDs (agencyId, serviceCategoryId,
// familyAddressId) — it does NOT return resolved names. Screens must use
// EnrichedBooking (below) if they need to display an agency or category name.
export interface ApiBooking {
  id: string;
  familyId: string;
  agencyId: string;
  workerId: string | null;
  workerName: string | null;
  serviceCategoryId: string;
  familyAddressId: string;
  status: BookingStatus;
  startTime: string;    // ISO-8601
  endTime: string;      // ISO-8601
  isRecurring: boolean;
  recurrenceRule?: string;
  hourlyRateMinorUnits: number;
  priceOverridden: boolean;
  totalHours: number;
  subtotalMinorUnits: number;
  platformFeePct: number;
  platformFeeMinorUnits: number;
  agencyPayoutMinorUnits: number;
  familyNotes?: string;
  agencyNotes?: string;
  cancelledBy?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
  reviewed?: boolean;   // client-side only, not from API
}

/** Legacy alias */
export type Booking = ApiBooking;

// Client-side view model — ApiBooking plus names resolved from lookups,
// used anywhere a booking needs to be displayed (not sent back to the API).
export interface EnrichedBooking extends ApiBooking {
  agencyName: string;
  categoryName: string;
}

// Matches the real POST /bookings request body.
export interface BookingCreateRequest {
  agencyId: string;
  serviceCategoryId: string;
  familyAddressId: string;
  startTime: string;    // ISO-8601 UTC
  endTime: string;      // ISO-8601 UTC
  isRecurring: boolean;
  recurrenceRule?: string;
  hourlyRateMinorUnits?: number;
  familyNotes?: string;
}

export interface PaymentInitResponse {
  paystackReference: string;
  authorizationUrl: string;
  amount: number;       // minor units (pesewas)
  currency: string;
}

// ─── Notification Types ────────────────────────────────────────────────────────

export interface ApiNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  bookingId?: string;
  isRead: boolean;
  createdAt: string;
}

// ─── Legacy Worker Types (kept for backward compat with unused screens) ────────

export interface ApiWorker {
  workerId: number;
  userId: number;
  name: string;
  location: string;
  serviceType: string;
  bio: string;
  experienceYears: number;
  hourlyRate: number;
  avgRating: number;
  totalRatings: number;
  isVerified: boolean;
  available: boolean;
  availableDays: string;
}

/** Legacy alias */
export type Worker = ApiWorker;

// ─── Navigation param lists ───────────────────────────────────────────────────

export type RootStackParamList = {
  Welcome: undefined;
  Role: undefined;
  WorkerNote: undefined;
  Register: undefined;
  Login: undefined;
  EmailVerified: { token: string };
  MainTabs: undefined;
  AgencyProfile: { agency: AgencySummary };
  BookAgency: { agency: AgencySummary };
  Profile: { worker: ApiWorker };
  Confirm:{ booking: ApiBooking; agency: AgencySummary };
  BookingDetail: { bookingId: string };
  AgencyBookingDetail: { bookingId: string };
  AddWorker: undefined;
  Review: { bookingId: string };
  Notifications: undefined;
  AddAddress: undefined;
  Subscription: undefined;
  WorkerProfileSetup: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Bookings: undefined;
  NotificationsTab: undefined;
  Account: undefined;
};