import apiClient from './client';

export interface ApiFamilyProfile {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  householdNotes?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export async function getFamilyProfile(): Promise<ApiFamilyProfile> {
  const res = await apiClient.get('/family/me');
  const raw = res.data as any;
  return raw?.data ?? raw;
}