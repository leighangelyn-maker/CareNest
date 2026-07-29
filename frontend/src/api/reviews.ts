import apiClient from './client';

/**
 * Submit a review for a completed booking.
 * bookingId is a UUID string.
 */
export async function submitReview(
  bookingId: string,
  rating: number,
  comment?: string,
): Promise<void> {
  await apiClient.post('/reviews', { bookingId, rating, comment });
}
