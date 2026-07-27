import apiClient from './client';
import { ApiWorker } from '../types';

export async function searchWorkers(serviceType?: string): Promise<ApiWorker[]> {
  const params = serviceType && serviceType !== 'All' ? { serviceType } : {};
  const res = await apiClient.get<ApiWorker[]>('/workers/search', { params });
  return res.data;
}

export async function getWorker(id: number): Promise<ApiWorker> {
  const res = await apiClient.get<ApiWorker>(`/workers/${id}`);
  return res.data;
}
