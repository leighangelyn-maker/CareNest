import apiClient from './client';

export interface ApiNotification {
  id: string;
  type: string; // e.g. "NEW_BOOKING_REQUEST"
  title: string;
  message: string;
  bookingId?: string;
  isRead: boolean;
  createdAt: string;
}

export async function getNotifications(): Promise<ApiNotification[]> {
  const res = await apiClient.get('/notifications');
  const raw = res.data;
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.page?.data)) return raw.page.data;
  return [];
}

export async function getUnreadCount(): Promise<number> {
  const res = await apiClient.get('/notifications/unread-count');
  const raw = res.data;
  if (typeof raw === 'number') return raw;
  if (typeof raw?.data === 'number') return raw.data;
  return raw?.count ?? 0;
}

export async function markAsRead(id: string): Promise<void> {
  await apiClient.patch(`/notifications/${id}/read`);
}

export async function markAllAsRead(): Promise<void> {
  await apiClient.patch('/notifications/read-all');
}