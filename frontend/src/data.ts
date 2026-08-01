

import { ApiBooking, ApiConversation, ApiMessage } from './types';

// ─── Category filter chips ────────────────────────────────────────────────────
export const CATS = ['All', 'Nanny', 'Cook', 'Cleaner', 'Caregiver', 'Driver', 'Gardener', 'Tutor'];

// ─── Cached location city (set by HomeScreen on load) ────────────────────────
let _cachedCity = 'Accra';
export function setCachedCity(city: string) { _cachedCity = city; }
export function getCachedCity() { return _cachedCity; }

// ─── Legacy Worker type ───────────────────────────────────────────────────────
export interface Worker {
  name: string; cat: string; rate: number; rating: number;
  jobs: number; about: string; skills: string[];
}