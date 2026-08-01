import apiClient from './client';
import { ApiWorker, ApiAgencyWorker, WorkerCreateRequest } from '../types';

export async function getWorkersForAgency(agencyId: string): Promise<ApiAgencyWorker[]> {
  const res = await apiClient.get(`/workers/agency/${agencyId}`);
  const raw = res.data;
  if (Array.isArray(raw)) return raw;
  if (Array.isArray((raw as any)?.data)) return (raw as any).data;
  return [];
}
export async function createWorker(req: WorkerCreateRequest): Promise<ApiAgencyWorker> {
  const res = await apiClient.post('/workers', req);
  const raw = res.data as any;
  return raw?.data ?? raw;
}

export async function searchWorkers(serviceType?: string): Promise<ApiWorker[]> {
  const params = serviceType && serviceType !== 'All' ? { serviceType } : {};
  const res = await apiClient.get<ApiWorker[]>('/workers/search', { params });
  return res.data;
}

export async function getWorker(id: number): Promise<ApiWorker> {
  const res = await apiClient.get<ApiWorker>(`/workers/${id}`);
  return res.data;
}