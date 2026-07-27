import { AgencyProfile, ApiBooking, ApiConversation, ApiMessage } from './types';

// ─── Category filter chips ────────────────────────────────────────────────────
export const CATS = ['All', 'Nanny', 'Cook', 'Cleaner', 'Caregiver', 'Driver', 'Gardener', 'Tutor'];

// ─── Cached location city (set by HomeScreen on load) ────────────────────────
let _cachedCity = 'Accra';
export function setCachedCity(city: string) { _cachedCity = city; }
export function getCachedCity() { return _cachedCity; }

// ─── Mock agencies — city is set dynamically from device location ─────────────
export function getMockAgencies(): AgencyProfile[] {
  const city = _cachedCity;
  return [
    {
      id: 'mock-001',
      name: 'BrightCare Domestic Services',
      slug: 'brightcare',
      logoUrl: null,
      averageRating: 4.9,
      totalReviews: 128,
      city,
      description: `Trusted nanny and housekeeping agency serving ${city} households since 2018. All workers are ID-verified with background checks on file.`,
      isAcceptingBookings: true,
      categories: ['Nanny', 'Cleaner', 'Caregiver'],
    },
    {
      id: 'mock-002',
      name: 'HomeHelp Ghana',
      slug: 'homehelp-ghana',
      logoUrl: null,
      averageRating: 4.7,
      totalReviews: 64,
      city,
      description: `Specialised domestic staffing for busy families in ${city}. Cooks, cleaners, and caregivers available on flexible schedules.`,
      isAcceptingBookings: true,
      categories: ['Cook', 'Cleaner', 'Nanny'],
    },
    {
      id: 'mock-003',
      name: 'SafeHands Care Agency',
      slug: 'safehands',
      logoUrl: null,
      averageRating: 4.8,
      totalReviews: 95,
      city,
      description: 'Elder and child care specialists. CPR-certified caregivers and trained nannies for newborns through school-age children.',
      isAcceptingBookings: true,
      categories: ['Caregiver', 'Nanny'],
    },
    {
      id: 'mock-004',
      name: 'CleanPro Services',
      slug: 'cleanpro',
      logoUrl: null,
      averageRating: 4.6,
      totalReviews: 73,
      city,
      description: 'Deep-cleaning and recurring housekeeping plans. Eco-friendly supplies provided. Available weekday and weekend slots.',
      isAcceptingBookings: true,
      categories: ['Cleaner'],
    },
    {
      id: 'mock-005',
      name: `${city} Home Staffing`,
      slug: 'home-staffing',
      logoUrl: null,
      averageRating: 4.5,
      totalReviews: 41,
      city,
      description: `Full-service domestic staffing for ${city} residences: drivers, gardeners, cooks, and housekeepers.`,
      isAcceptingBookings: false,
      categories: ['Driver', 'Gardener', 'Cook', 'Cleaner'],
    },
  ];
}

// Alias for backward compat
export const MOCK_AGENCIES = getMockAgencies();

// ─── Mock bookings ────────────────────────────────────────────────────────────
export const MOCK_BOOKINGS: ApiBooking[] = [
  {
    id: 'mock-booking-001',
    status: 'ASSIGNED',
    agency: { id: 'mock-001', name: 'BrightCare Domestic Services' },
    category: 'Nanny',
    startTime: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
    endTime: new Date(Date.now() + 3 * 24 * 3600 * 1000 + 8 * 3600 * 1000).toISOString(),
    totalHours: 8,
    subtotalMinorUnits: 50000,
    platformFeeMinorUnits: 5000,
    currency: 'GHS',
    familyNotes: 'Please arrive by 8am.',
    reviewed: false,
  },
  {
    id: 'mock-booking-002',
    status: 'COMPLETED',
    agency: { id: 'mock-002', name: 'HomeHelp Ghana' },
    category: 'Cook',
    startTime: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
    endTime: new Date(Date.now() - 7 * 24 * 3600 * 1000 + 4 * 3600 * 1000).toISOString(),
    totalHours: 4,
    subtotalMinorUnits: 18000,
    platformFeeMinorUnits: 1800,
    currency: 'GHS',
    reviewed: false,
  },
  {
    id: 'mock-booking-003',
    status: 'COMPLETED',
    agency: { id: 'mock-003', name: 'SafeHands Care Agency' },
    category: 'Cleaner',
    startTime: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString(),
    endTime: new Date(Date.now() - 14 * 24 * 3600 * 1000 + 3 * 3600 * 1000).toISOString(),
    totalHours: 3,
    subtotalMinorUnits: 13500,
    platformFeeMinorUnits: 1350,
    currency: 'GHS',
    reviewed: true,
  },
];

// ─── Mock conversations ───────────────────────────────────────────────────────
export const MOCK_CONVERSATIONS: ApiConversation[] = [
  {
    id: 'mock-conv-001',
    bookingId: 'mock-booking-001',
    otherPartyName: 'BrightCare Domestic Services',
    lastMessage: 'Your nanny will arrive at 8am on Friday. Please have the address ready.',
    lastMessageAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    unreadCount: 1,
  },
  {
    id: 'mock-conv-002',
    bookingId: 'mock-booking-002',
    otherPartyName: 'HomeHelp Ghana',
    lastMessage: 'Thank you for booking with us! We hope the cook met your expectations.',
    lastMessageAt: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
    unreadCount: 0,
  },
];

// ─── Mock messages ────────────────────────────────────────────────────────────
export const MOCK_MESSAGES: Record<string, ApiMessage[]> = {
  'mock-conv-001': [
    {
      id: 'msg-001', conversationId: 'mock-conv-001',
      senderId: 'agency-001', senderName: 'BrightCare',
      content: 'Hello! We have received your booking request.',
      sentAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    },
    {
      id: 'msg-002', conversationId: 'mock-conv-001',
      senderId: 'agency-001', senderName: 'BrightCare',
      content: 'Your nanny will arrive at 8am on Friday. Please have the address ready.',
      sentAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    },
  ],
  'mock-conv-002': [
    {
      id: 'msg-003', conversationId: 'mock-conv-002',
      senderId: 'agency-002', senderName: 'HomeHelp Ghana',
      content: 'Thank you for booking with us! We hope the cook met your expectations.',
      sentAt: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
    },
  ],
};

// ─── Legacy Worker type ───────────────────────────────────────────────────────
export interface Worker {
  name: string; cat: string; rate: number; rating: number;
  jobs: number; about: string; skills: string[];
}
