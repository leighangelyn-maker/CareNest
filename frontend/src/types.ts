// ─── Agency Types ─────────────────────────────────────────────────────────────

export interface AgencySummary {
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

// ─── Booking Types ────────────────────────────────────────────────────────────

export type BookingStatus =
  | 'PENDING_ASSIGNMENT'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export interface ApiBooking {
  id: string;           // UUID
  status: BookingStatus;
  agency: { id: string; name: string };
  category: string;
  startTime: string;    // ISO-8601
  endTime: string;      // ISO-8601
  totalHours: number;
  subtotalMinorUnits: number;
  platformFeeMinorUnits: number;
  currency: string;
  familyNotes?: string;
  reviewed?: boolean;   // client-side only
}

/** Legacy alias */
export type Booking = ApiBooking;

export interface BookingCreateRequest {
  agencyId: string;
  categoryId: number;
  startTime: string;    // ISO-8601 UTC
  endTime: string;      // ISO-8601 UTC
  isRecurring: boolean;
  familyNotes?: string;
}

export interface PaymentInitResponse {
  paystackReference: string;
  authorizationUrl: string;
  amount: number;       // minor units (pesewas)
  currency: string;
}

// ─── Message / Conversation Types ─────────────────────────────────────────────

export interface ApiConversation {
  id: string;           // conversationId UUID
  bookingId: string;
  otherPartyName: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface ApiMessage {
  id: string;           // UUID
  conversationId: string;
  senderId: string;     // UUID
  senderName: string;
  content: string;      // message text (was "body" in old schema)
  sentAt: string;       // ISO-8601
  status?: 'sent' | 'delivered' | 'read';
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
  // Agency-centric screens (new)
  AgencyProfile: { agency: AgencySummary };
  BookAgency: { agency: AgencySummary };
  // Legacy worker screen
  Profile: { worker: ApiWorker };
  // Booking flow
  Pay: { booking: ApiBooking; agency: AgencySummary };
  Confirm: { booking: ApiBooking };
  BookingDetail: { bookingId: string };
  Review: { bookingId: string };
  // Messages — now keyed by conversationId
  Messages: { conversationId: string };
  // Other
  Subscription: undefined;
  WorkerProfileSetup: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Bookings: undefined;
  MessagesTab: undefined;
  Account: undefined;
};
